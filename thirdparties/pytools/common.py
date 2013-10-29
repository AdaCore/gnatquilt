#! /usr/bin/env python

import hashlib
import json
import os
import platform
import re
import shlex
import shutil
import stat
import sys
import tarfile
import tempfile
import traceback
import urllib2
import zipfile

import ConfigParser

from datetime import datetime
from subprocess import PIPE
from subprocess import Popen


###############################################################################
## Constants

CSI = '\033['
MKTEMP_PREFIX = 'qm-tempfile-'
TIME_FORMAT = '%H:%M:%S.%f'
DATETIME_FORMAT = '%Y-%m-%d %H:%M:%S'
CONFIG_ATTR_FORMAT = re.compile('^([0-9a-zA-Z_\-:]+)\.([0-9a-zA-Z_\-\.]+)$')

ARCHS = {
    ('Darwin',  'x86_64'): ('darwin', 'x64-darwin'),
    ('Linux',   'x86_64'): ('linux', 'x64-linux'),
    ('Linux',   'i686'):   ('linux', 'x86-linux'),
    ('Windows', 'i686'):   ('windows', 'x86-windows'),
    ('Windows', 'AMD64'):  ('windows', 'x64-windows')}


###############################################################################
## InferiorError

class InferiorError(Exception):
    """Exception class for errors on inferiors."""

    def __init__(self, exit_code, message):
        """Inherited Documentation."""

        super(InferiorError, self).__init__()

        self.exit_code = exit_code
        self.message = message


###############################################################################
## PyToolsError

class PyToolsError(Exception):
    """Generic Error from this module."""


###############################################################################
## AbstractMethod

class AbstractMethod(Exception):
    """Unimplemented abstract method."""


###############################################################################
## override

def override(method):
    """Override decorator.
    It is only used for sources clarity purpose.
    """

    return method


###############################################################################
## Daemon

class Daemon(object):
    """Controlled object to handle a daemonized process."""

    def __init__(self, argv):
        self._argv = argv
        self._process = None

    def __enter__(self):
        self._process = Process(self._argv)
        self._process.daemonize()
        return self._process

    def __exit__(self, eType, eValue, eTraceback):
        if eValue:
            traceback.print_exception(eType, eValue, eTraceback,
                                      file=sys.stderr)
            raise PyToolsError('Exception raised in Daemon: ' + self._argv[0])

        assert self._process is not None
        Console.trace('Terminating process: ' + self._argv[0])
        self._process.terminate()


###############################################################################
## ControlledUrlOpen

class ControlledUrlOpen(object):
    """Controlled object to handle "file-like" urllib2.urlopen return object
    that does not implement __enter__ and __exit__ method, prohibiting the use
    of such objects in a with clause.
    """

    def __init__(self, url):
        self._url = url

    def __enter__(self):
        self._remote_file = urllib2.urlopen(self._url)
        return self._remote_file

    def __exit__(self, eType, eValue, eTraceback):
        if eValue:
            traceback.print_exception(eType, eValue, eTraceback,
                                      file=sys.stderr)
            raise PyToolsError('Exception raised in ControlledUrlOpen')

        assert self._remote_file
        Console.trace('Closing remote file: ' + self._remote_file.geturl())
        self._remote_file.close()


###############################################################################
## ControlledTempDirectory

class ControlledTempDirectory(object):
    """Controlled temporary directory to be used w/ the WITH construction of
    python for automatic creation and deletion.
    """

    def __init__(self):
        self._dirname = None

    def __enter__(self):
        self._dirname = tempfile.mkdtemp(prefix=MKTEMP_PREFIX)
        return self._dirname

    def __exit__(self, eType, eValue, eTraceback):
        if eValue:
            traceback.print_exception(eType, eValue, eTraceback,
                                      file=sys.stderr)
            raise PyToolsError('Exception raised in ControlledTempDirectory')

        assert self._dirname is not None
        Console.trace('Cleaning temporary directory: ' + self._dirname)
        Os.rmtree(self._dirname)


###############################################################################
## ControlledWorkspace

class ControlledWorkspace(object):
    """Controlled temporary directory to be used w/ the WITH construction of
    python for automatic creation and deletion.
    """

    def __init__(self, opt_cleanup=True, opt_dirname=None, opt_tarball=None,
                 opt_subdir=None, opt_guess_root_dir=False):

        assert not (opt_subdir and opt_guess_root_dir), \
            "opt_subdir and opt_guess_root_dir are nutually exclusive"

        self._dirname = opt_dirname
        self._tarball = opt_tarball
        self._subdir = opt_subdir
        self._do_cleanup = opt_cleanup
        self._guess_root_dir = opt_guess_root_dir

    def __enter__(self):
        if self._dirname is None:
            self._dirname = tempfile.mkdtemp(prefix=MKTEMP_PREFIX)

        Console.trace('Preparing workspace: ' + self._dirname)

        if self._tarball:
            Console.trace('Extracting tarball: ' + self._tarball)
            Deflator.deflate(self._tarball, self._dirname)

        if self._subdir:
            return os.path.join(self._dirname, self._subdir)

        rootdir = None

        if self._guess_root_dir:
            nodes = os.listdir(self._dirname)

            for node in nodes:
                if node == '.' or node == '..':
                    continue

                target = os.path.join(self._dirname, node)

                if os.path.isdir(target):
                    if rootdir is not None:
                        # More than one directory, cannot guess
                        rootdir = None
                        break
                    else:
                        rootdir = target

        if rootdir is not None:
            Console.trace('Found root directory: ' + rootdir)
        else:
            Console.trace('Using temporary directory: ' + self._dirname)

        return rootdir if rootdir is not None else self._dirname

    def __exit__(self, eType, eValue, eTraceback):
        if eValue:
            traceback.print_exception(eType, eValue, eTraceback,
                                      file=sys.stderr)
            raise PyToolsError('Exception raised in ControlledWorkspace')

        assert self._dirname is not None

        if self._do_cleanup:
            Console.trace('Cleaning temporary workspace: ' + self._dirname)
            Os.rmtree(self._dirname)


###############################################################################
## ControlledChangeDirectory

class ControlledChangeDirectory(object):
    """Controlled change directory to be used w/ the WITH construction of
    python for automatic chdir.
    """

    def __init__(self, directory):
        self._directory = directory
        self._dirname = os.getcwd()

    def __enter__(self):
        os.chdir(self._directory)
        return self._directory

    def __exit__(self, eType, eValue, eTraceback):
        if eValue:
            traceback.print_exception(eType, eValue, eTraceback,
                                      file=sys.stderr)
            raise PyToolsError('Exception raised in ControlledChangeDirectory')

        assert self._dirname is not None
        os.chdir(self._dirname)


###############################################################################
## AnsiCode

class AnsiCodes(object):
    def __init__(self, codes):
        for name in dir(codes):
            if not name.startswith('_'):
                value = getattr(codes, name)
                setattr(self, name, self.__format(value))

    def __format(self, code):
        return '%s%sm' % (CSI, str(code))


###############################################################################
## DefaultCodes

class DefaultCodes(object):
    def __init__(self, codes):
        for name in dir(codes):
            if not name.startswith('_'):
                value = getattr(codes, name)
                setattr(self, name, self.__format(value))

    def __format(self, code):
        return ''


###############################################################################
## AnsiForeground

class AnsiForeground(object):
    BLACK = 30
    RED = 31
    GREEN = 32
    YELLOW = 33
    BLUE = 34
    MAGENTA = 35
    CYAN = 36
    WHITE = 37
    RESET = 39


###############################################################################
## AnsiBackground

class AnsiBackground(object):
    BLACK = 40
    RED = 41
    GREEN = 42
    YELLOW = 43
    BLUE = 44
    MAGENTA = 45
    CYAN = 46
    WHITE = 47
    RESET = 49


###############################################################################
## AnsiStyle

class AnsiStyle(object):
    BRIGHT = 1
    DIM = 2
    NORMAL = 22
    RESET_ALL = 0


###############################################################################
## Os

class Os(object):
    """???"""

    @staticmethod
    def _rmtree_onerror(func, path, exc_info):
        """Error handler for ``shutil.rmtree``.

        If the error is due to an access error (read only file)
        it attempts to add write permission and then retries.

        If the error is for another reason it re-raises the error.

        Usage : ``shutil.rmtree(path, onerror=onerror)``
        """

        if not os.access(path, os.W_OK):
            # Is the error an access error ?
            os.chmod(path, stat.S_IWUSR)
            func(path)

        else:
            raise

    @staticmethod
    def rmtree(path):
        """Provide shutil.rmtree with an error handler in charge of providing
        the write permission in case such an error prevent rmtree to do its job
        (which is a likely scenario on Windows.
        """

        shutil.rmtree(path, onerror=Os._rmtree_onerror)

    @staticmethod
    def makedirs(path):
        """Tests the existance of PATH and creates it if necessary.
        Raises an error if PATH is not a directory.
        """

        if os.path.exists(path):
            if not os.path.isdir(path):
                raise PyToolsError('Expected a directory: ' + path)

            # Exit if the directory already exists
            return

        # Create the directory otherwise
        Console.trace('Creating directory: ' + path)
        os.makedirs(path)

    @staticmethod
    def append_env(variable, path, formatter=None):
        """Appends the given path to the environment variable."""

        ppath = os.environ[variable] if variable in os.environ else ''

        if path in ppath.split(os.pathsep):
            # Already in the PYTHONPATH
            return

        if formatter:
            path = formatter(path)

        # Do NOT use os.putenv as it does not update os.environ
        os.environ[variable] = '%s%s%s' % (path, os.pathsep, ppath)

    @staticmethod
    def install(src, dst):
        """Copy SRC into DST.

        SRC can be either a file or a directory. If SRC is a directory, the
        entire subtree is copied into DST. Be aware that this may overwrite
        files that already exists in DST. This function differs from
        shutil.copytree in that it allows the copy of a tree in place into
        another directory, which is the goal of installing SRC into an already
        existing installation directory.
        """

        Console.trace('Intalling: %s -> %s' % (src, dst))

        def _ignore(src, names):
            return ['.svn', '.git']

        if os.path.isdir(src):
            Os.install_dir(src, os.path.join(dst, os.path.basename(src)),
                           ignore=_ignore)
        else:
            shutil.copy2(src, dst)

    @staticmethod
    def install_dir(src, dst, symlinks=False, ignore=None):
        """Do the work for install, given SRC being a directory."""

        names = os.listdir(src)

        if ignore is not None:
            ignored_names = ignore(src, names)
        else:
            ignored_names = set()

        Os.makedirs(dst)
        errors = []

        for name in names:
            srcname = os.path.join(src, name)
            dstname = os.path.join(dst, name)

            try:
                if name in ignored_names:
                    continue

                if symlinks and os.path.islink(srcname):
                    if os.path.exists(dstname):
                        # Delete the simlink if exists
                        os.unlink(dstname)

                    linkto = os.readlink(srcname)
                    os.symlink(linkto, dstname)

                elif os.path.isdir(srcname):
                    Os.install_dir(srcname, dstname, symlinks, ignore)

                else:
                    shutil.copy2(srcname, dstname)

            # Catch the Error from the recursive copytree so that we can
            # continue with other files.
            except (IOError, os.error) as why:
                errors.append((srcname, dstname, str(why)))

            except PyToolsError as err:
                errors.extend(err.args[0])

        try:
            shutil.copystat(src, dst)

        except shutil.WindowsError:
            # can't copy file access times on Windows
            pass
        except OSError as why:
            errors.extend((src, dst, str(why)))

        if errors:
            raise PyToolsError(errors)

    @staticmethod
    def safe_remove(target):
        """Safely remove the file or directory pointed to by target, if
        exists."""

        if os.path.exists(target):
            if os.path.isdir(target):
                Os.rmtree(target)
            else:
                os.unlink(target)

    @staticmethod
    def package(directory, distfile):
        """Compresses DIRECTORY into DISTFILE using gzip compression
        algorithm."""

        if not os.path.exists(directory) or not os.path.isdir(directory):
            raise PyToolsError('%s: No such directory' % directory)

        if os.path.exists(distfile):
            raise PyToolsError('%s already exists' % distfile)

        with ControlledChangeDirectory(os.path.dirname(directory)):
            with tarfile.open(distfile, 'w:gz') as tar:
                tar.add(os.path.basename(directory), recursive=True)

            Console.trace('Distfile created: ' + distfile)

    @staticmethod
    def spawn(argv, cwd=os.getcwd(), opt_alternate_output_writer=None):
        """Spawns the process described by the ARGV array provided.
        Dumps the process standard and error output only on failure.
        """

        assert len(argv) > 0

        Console.trace('Spawning inferior: %s in "%s"' % (argv[0], cwd))
        Console.trace(['Argument = %s' % line for line in argv[1:]])

        exit_code = None
        out = None
        err = None

        proc = Process(argv)

        try:
            (exit_code, out, err) = Process(argv).spawn(opt_pipe=True,
                                                        opt_cwd=cwd)

        except OSError as why:
            Console.err('Inferior: %r' % argv, newline=True)
            # 127 is the default shell exit code for 'Command not found' error
            raise InferiorError(127, str(why))

        if exit_code is None:
            Console.trace('Failed to execute process')
            proc.kill()
            raise InferiorError(1, 'Failed to spawn child')

        Console.trace('Exit_Code = %i' % exit_code)

        if exit_code != 0:
            if opt_alternate_output_writer is not None:
                opt_alternate_output_writer(out, err)
            else:
                Console.newline(stream=sys.stderr)
                Console.err(out.splitlines())
                Console.err(err.splitlines())

            raise InferiorError(exit_code,
                                'Process exited with invalid exit code')

        Console.trace(out.splitlines() if out else [])
        Console.trace(err.splitlines() if err else [])

        assert exit_code == 0

        return (exit_code, out, err)


###############################################################################
## Deflator

class Deflator(object):
    """Generic deflator interface."""

    def __init__(self, path, remove_root_dir=False):
        """Initializes the deflator object w/ the path to the archive."""

        super(Deflator, self).__init__()
        self._path = path
        self._remove_root_dir = remove_root_dir

    def path(self):
        """Returns the path to the archive."""

        return self._path

    @staticmethod
    def get_names(archive):
        """Returns the members as a list of their names."""

        raise AbstractMethod('Deflator.get_names')

    def extract(self, target_dir):
        """Extract all members from the archive to the directory TARGET_DIR.
        """

        raise AbstractMethod('Deflator.extract')

    def _extract(self, archive, target_dir):
        root_dir = None
        output_dir = None

        if self._remove_root_dir:
            root_dir = self.get_root_directory(archive)

            if root_dir is None:
                Console.trace('No obvious root directory for: %s' % self._path)
                Console.trace('Aborting...')
                return

            output_dir = os.path.dirname(target_dir)
        else:
            output_dir = target_dir

        archive.extractall(output_dir)

        if self._remove_root_dir:
            # Rename the deflated directory into the expected target directory
            # name.
            src_dir = os.path.join(output_dir, root_dir)

            if os.path.realpath(src_dir) == os.path.realpath(target_dir):
                Console.trace('Directory already has the correct name: ' +
                              src_dir)
                return

            if os.path.exists(target_dir):
                # Remove the target_dir that should have been created by the
                # calling procedure.
                Os.rmtree(target_dir)

            Console.trace('Renaming %s -> %s' % (src_dir, target_dir))
            os.rename(src_dir, target_dir)

    def get_root_directory(self, archive):
        """This function should provide a good heuristic to extract the root
        directory of the common path for all members of the archive.
        """

        common_path = os.path.commonprefix(self.get_names(archive))

        if not common_path:
            # There is no obvious root directory
            return None

        return common_path.split('/')[0]

    @staticmethod
    def is_archive(path):
        # A JAR file is a ZIP archive so we ensure that we do not deflate a JAR
        # file.

        return os.path.exists(path) and not path.endswith('.jar') and \
            (TarDeflator.is_archive(path) or ZipDeflator.is_archive(path))

    @staticmethod
    def deflate(path, target_dir, remove_root_dir=False):
        deflator = None

        path = os.path.relpath(path)

        if not os.path.exists(path):
            raise PyToolsError('%s: No such archive' % path)

        if ZipDeflator.is_archive(path):
            deflator = ZipDeflator(path, remove_root_dir)
        elif TarDeflator.is_archive(path):
            deflator = TarDeflator(path, remove_root_dir)
        else:
            raise PyToolsError('Unknown file format: %s' % path)

        deflator.extract(target_dir)


###############################################################################
## TarDeflator

class TarDeflator(Deflator):
    """Deflator implementation for .tar files."""

    @staticmethod
    def get_names(archive):
        """Inherited Documentation."""

        return archive.getnames()

    @staticmethod
    def is_archive(path):
        """Whether the file pointed to by path is an TAR archive or not."""

        return tarfile.is_tarfile(path)

    @override
    def extract(self, target_dir):
        """Inherited Documentation."""

        try:
            with tarfile.open(self._path) as archive:
                self._extract(archive, target_dir)

        except tarfile.TarError as why:
            raise PyToolsError('Error delfating archive %s: %s' %
                               (self._path, str(why)))


###############################################################################
## ZipDeflator

class ZipDeflator(Deflator):
    """Deflator implementation for .zip files."""

    @staticmethod
    def get_names(archive):
        """Inherited Documentation."""

        return archive.namelist()

    @staticmethod
    def is_archive(path):
        """Whether the file pointed to by path is an ZIP archive or not."""

        return zipfile.is_zipfile(path)

    @override
    def extract(self, target_dir):
        """Inherited Documentation."""

        try:
            with zipfile.ZipFile(self._path) as archive:
                self._extract(archive, target_dir)

        except zipfile.BadZipfile as why:
            raise PyToolsError('Error delfating archive %s: %s' %
                               (self._path, str(why)))


###############################################################################
## System

class System(object):
    """System class, defines some constants."""

    windows = platform.system() == 'Windows'
    darwin = platform.system() == 'Darwin'
    linux = platform.system() == 'Linux'

    @staticmethod
    def get_arch_identifiers(opt_arch=None):
        """Returns the string corresponding to the current architecture."""

        if opt_arch is None:
            return ARCHS[(platform.system(), platform.machine())]
        else:
            if not opt_arch in ARCHS.values():
                raise PyToolsError('Unsuported target architecture: ' +
                                   opt_arch)
            return opt_arch

    @classmethod
    def normalize_path(cls, path):
        """Normalizes the absolute path on Windows so that the DOS-like path is
        converted into a UNIX-like path using the cygpath utility.
        Leaves the path untouch if not using cygwin.
        """

        if cls.windows:
            # Assume using cygwin, and thus having access to cygpath utility
            # Return stdout from the spawn command
            return Os.spawn(['cygpath', '-cw', path])[1][:-1]

        else:
            return path

    @classmethod
    def escape_path(cls, path):
        """Normalizes the absolute path on Windows so that the output is a
        DOS-like. It is actualy the reverse of _normalize_path.
        Leaves the path untouch if not using cygwin.
        """

        if cls.windows:
            # Assume using cygwin, and thus having access to cygpath utility
            # Return stdout from the spawn command
            return Os.spawn(['cygpath', '-aw', path])[1][:-1]

        else:
            return path


###############################################################################
## Console

class Console(object):
    """Console abstraction."""

    NO_COLOR = ''
    SEP = 79 * '-' + os.linesep

    fg = None
    bg = None
    style = None

    is_advanced_output_stream = False

    # Class-wide parameter
    _previous_phase = None
    _verbose = False
    _debug = False
    _tool = '__tool__'

    @classmethod
    def init(cls, tool):
        """Initialize the logger for a specific execution."""

        cls._tool = tool

    @classmethod
    def log_start(cls, title):
        """Starts logging activity."""

        cls._log_start_time = datetime.now()

        cls.out('%s%s%s%s%s' % (cls.SEP, title, os.linesep, cls.SEP,
                                os.linesep))

    @classmethod
    def log_end(cls, success):
        """Stops the log activity."""

        finish = datetime.now()
        ellapsed = finish - cls._log_start_time

        m = cls.out if success else cls.err
        m(os.linesep + cls.SEP)

        if success:
            m('BUILD SUCCESSFUL', newline=False)
        else:
            m('BUILD FAILED', newline=False)

        m(os.linesep + cls.SEP)

        m('Total time: %s%s' % (str(ellapsed), os.linesep))
        m('Finished at: %s%s%s' % (finish.strftime(DATETIME_FORMAT),
                                   os.linesep, cls.SEP))

    @classmethod
    def is_advanced_output(cls):
        """Whether the console has advanced capabilities or not."""

        return cls.is_advanced_output_stream

    @classmethod
    def set_advanced_output(cls, is_advanced_output_stream):
        """Sets whether the output stream has advanced capabilities."""

        cls.is_advanced_output_stream = is_advanced_output_stream

    @classmethod
    def is_verbose(cls):
        """Returns whether the verbose mode is ON or OFF."""

        return cls._verbose

    @classmethod
    def set_verbose(cls, verbose):
        """Toggle ON/OFF the verbose output."""

        cls._verbose = verbose

    @classmethod
    def is_debug(cls):
        """Returns whether the debug mode is ON or OFF."""

        return cls._debug

    @classmethod
    def set_debug(cls, debug):
        """Toggle ON/OFF the debug output."""

        cls._debug = debug

    @classmethod
    def set_codes(cls, fg, bg, style):
        """Sets the default codes."""

        cls.fg = fg
        cls.bg = bg
        cls.style = style

    @classmethod
    def _write(cls, output, stream=sys.stdout, newline=False):
        """Write output on the given stream."""

        if isinstance(output, basestring):
            stream.write(output)

        else:
            for line in output:
                stream.write('%s%s' % (line, os.linesep))

        if newline:
            cls.newline()

        stream.flush()

    @classmethod
    def out(cls, output, newline=False):
        """Writes output on stdout."""

        cls._write(output, newline=newline)

    @classmethod
    def err(cls, output, newline=False):
        """Writes output on stderr."""

        cls._write(output, stream=sys.stderr, newline=newline)

    @classmethod
    def flush(cls):
        """Flushes both output stream."""

        sys.stdout.flush()
        sys.stderr.flush()

    @staticmethod
    def truncate(message, limit):
        """Truncates in input message to the limit, adding ... if necessary."""

        return message if len(message) < limit \
            else ('...' + message[-(limit - 3):])

    @classmethod
    def _trace(cls, level, output):
        """Generic version of trace() and debug()."""

        if isinstance(output, basestring):
            f = '[%s%s%s] %s - %s%s%s'

            cls.out(f % (cls.fg.BLUE, level, cls.fg.RESET, output,
                         cls.fg.YELLOW, datetime.now().strftime(TIME_FORMAT),
                         cls.fg.RESET), newline=True)

        else:
            [cls._trace(level, m) for m in output]

    @classmethod
    def trace(cls, output):
        """Prints a trace log."""

        if cls._verbose:
            cls._trace('TRACE', output)

    @classmethod
    def debug(cls, output):
        """Prints a debug log."""

        if cls._debug:
            cls._trace('DEBUG', output)

    @classmethod
    def info(cls, output):
        """Prints an info log."""

        cls._trace('INFO', output)

    @classmethod
    def newline(cls, stream=sys.stdout):
        """Prints a newline."""

        stream.write(os.linesep)

    @classmethod
    def clear(cls, nb_cols, stream=sys.stdout):
        """Clear the current line."""

        stream.write('\r' + (' ' * nb_cols) + '\r')

    @classmethod
    def print_stack_trace(cls):
        """Prints the execution stack trace if verbose mode is ON."""

        if cls._verbose:
            exc_type, exc_value, exc_traceback = sys.exc_info()
            traceback.print_exception(exc_type, exc_value, exc_traceback,
                                      file=sys.stderr)


###############################################################################
## InteractiveLogger

class InteractiveLogger(object):
    """Provides high-level functionalities for an interactive output."""

    def __init__(self, step, message):
        """Class ctor."""

        if not isinstance(message, basestring):
            raise PyToolsError('Expected a string type')

        self.__step = step
        self.__tool = Console._tool
        self.__original_msg = message

        self.__prefix = '%s.%s' % (self.__tool, self.__step)
        self.__msg_length = 48
        self.__msg = Console.truncate(self.__original_msg, self.__msg_length)
        self.__format_prefix = '%s%-20s%s %-' + str(self.__msg_length) + 's  '

        self.__log_start_time = datetime.now()
        self.__log_length = 0

    def started(self):
        """Action started."""

        f = self.__format_prefix + '[%s  --  %s]'

        # Save the values for use in post_step

        self.__log_start_time = datetime.now()
        self.__log_length = len(f % (Console.NO_COLOR, self.__prefix,
                                     Console.NO_COLOR, self.__msg,
                                     Console.NO_COLOR, Console.NO_COLOR))

        # Output the formatted log

        Console.out(f % (Console.fg.MAGENTA, self.__prefix,
                         Console.fg.RESET, self.__msg,
                         Console.fg.BLUE, Console.fg.RESET),
                    newline=Console.is_verbose())

    def skipped(self):
        """Action skipped."""

        f = self.__format_prefix + '[%s  OK  %s]'

        Console.out(f % (Console.fg.MAGENTA, self.__prefix,
                         Console.fg.RESET, self.__msg,
                         Console.fg.BLUE, Console.fg.RESET),
                    newline=True)

    def progress(self, percent):
        """Action in progress."""

        if self.__log_length and not Console.is_verbose():
            Console.clear(self.__log_length)

        f = self.__format_prefix + '[%s %3d%% %s]'

        self.__log_length = len(f % (Console.NO_COLOR, self.__prefix,
                                     Console.NO_COLOR, self.__msg,
                                     Console.NO_COLOR, int(percent),
                                     Console.NO_COLOR))

        Console.out(f % (Console.fg.MAGENTA, self.__prefix,
                         Console.fg.RESET, self.__msg,
                         Console.fg.BLUE, int(percent), Console.fg.RESET),
                    newline=Console.is_verbose())

    def completed(self, success=True):
        """Action completed."""

        if self.__log_length and not Console.is_verbose():
            Console.clear(self.__log_length)

        color = Console.fg.GREEN if success else Console.fg.RED
        status = 'OK' if success else 'KO'

        f = self.__format_prefix + '[%s  %s  %s]'

        Console.out(f % (Console.fg.MAGENTA, self.__prefix,
                         Console.fg.RESET, self.__msg,
                         color, status, Console.fg.RESET),
                    newline=True)


###############################################################################
## AutoLog

class AutoLog(object):
    """Controlled object to handle log.started and log.completed."""

    def __init__(self, step, message):
        self.__log = InteractiveLogger(step, message)

    def __enter__(self):
        self.__log.started()
        return self.__log

    def __exit__(self, eType, eValue, eTraceback):
        self.__log.completed(success=(eValue is None))


###############################################################################
## Process

class Process(object):
    """Spawns a given command and returns its exit code and output from
    standard and error stream.
    """

    def __init__(self, args):
        """Inherited Documentation."""

        super(Process, self).__init__()

        self.proc = None
        self.out = None
        self.err = None
        self.args = args

    @staticmethod
    def normalize_cmdline(cmdline):
        """Normalizes the cmdline to be usable w/ subprocess.Popen."""

        return shlex.split(cmdline)

    def spawn(self, opt_pipe=True, opt_cwd=os.getcwd()):
        """Spawns the process."""

        if opt_pipe:
            self.proc = Popen(self.args, stdout=PIPE, stderr=PIPE, cwd=opt_cwd)
        else:
            self.proc = Popen(self.args, cwd=opt_cwd)

        (self.out, self.err) = self.proc.communicate()
        return (self.proc.returncode, self.out, self.err)

    def daemonize(self, opt_cwd=os.getcwd()):
        """Spawns the process in the background."""

        self.proc = Popen(self.args, stdout=PIPE, stderr=PIPE, cwd=opt_cwd)

    def terminate(self):
        self.proc.terminate()
        (self.out, self.err) = self.proc.communicate()
        return (self.proc.returncode, self.out, self.err)

    def kill(self):
        """Kills the process if still alive."""

        self.proc.kill()


###############################################################################
## Phase

class Phase(object):
    """Generic interface for a phase."""

    def __init__(self, name):
        super(Phase, self).__init__()
        self._name = name

    def name(self):
        """The name of the phase."""

        return self._name

    def set_up(self, **kwargs):
        """Set up step before calling a phase. Default implementation is
        empty.
        """

        pass

    def tear_down(self, **kwargs):
        """Tear down step before calling a phase. Default implementation is
        empty.
        """

        pass

    def execute(self, **kwargs):
        """Abstract method for executing this phase."""

        raise AbstractMethod('Phase.execute')


###############################################################################
## PhaseAutomator

class PhaseAutomator(object):
    """Automate the phase launching."""

    _phases = {}
    _defaults = []

    @classmethod
    def register(cls, phase, default=False):
        """Register a phase implementing the Phase interface.
        Phases must have unique names.
        """

        if phase.name() in cls._phases.keys():
            raise PyToolsError('Phase already registered: ' + phase.name())

        cls._phases[phase.name()] = phase

        if default:
            cls._defaults.append(phase.name())

    @classmethod
    def registered_phase_ids(cls):
        """Returns the list of registered phase ids."""

        return cls._phases.keys()

    @classmethod
    def execute(cls, phase_id, **kwargs):
        """Returns the phase w/ the given ID (name)."""

        if phase_id not in cls._phases.keys():
            raise PyToolsError('Unknown phase: ' + phase_id)

        cls._phases[phase_id].set_up(**kwargs)
        cls._phases[phase_id].execute(**kwargs)
        cls._phases[phase_id].tear_down(**kwargs)

    @classmethod
    def run_sequentially(cls, phase_ids, **kwargs):
        """Executes all phases whose ID is in phase_ids."""

        [cls.execute(pid, **kwargs) for pid in phase_ids or cls._defaults]


###############################################################################
## Config

class Config(object):
    """Configuration management class."""

    def __init__(self, config_file):
        """Initializes the configuration class."""

        super(Config, self).__init__()

        self._file = config_file
        self._parser = ConfigParser.SafeConfigParser(allow_no_value=False)

        self._cur_module = None

    def exists(self):
        """Returns TRUE if a previous configuration file is found."""

        return os.path.exists(self._file) and os.path.isfile(self._file)

    def load(self):
        """Loads the configuration file."""

        try:
            if not self._parser.read([self._file]):
                raise PyToolsError('Failed to read configuration file')

        except ConfigParser.ParsingError as why:
            Console.trace('Error while reading configuration file')
            raise PyToolsError(str(why))

    def write(self):
        """Writes the current configuration into the configuration file."""

        try:
            with open(self._file, 'w') as config:
                self._parser.write(config)

        except ConfigParser.ParsingError as why:
            Console.trace('Error while writing configuration file')
            raise PyToolsError(str(why))

    def set_module(self, module):
        """Sets the current module in use. Allows shorter notation when
        accessing properties of a given module. Use NONE to reset current
        module.
        """

        self._cur_module = module

    def get(self, property, opt_module=None):
        """Accesses the property of the given module, or from the current
        module if OPT_MODULE is left unspecified. Returns NONE if the property
        or the module does not exits.
        """

        module = opt_module or self._cur_module

        if module is None:
            raise PyToolsError('No module specified')

        if not self._parser.has_section(module) or \
           not self._parser.has_option(module, property):
            return None

        return self._parser.get(module, property)

    def set(self, value, property, opt_module=None):
        """Sets the property of the given module, or from the current
        module if OPT_MODULE is left unspecified.
        """

        module = opt_module or self._cur_module

        if module is None:
            raise PyToolsError('No module specified')

        if not self._parser.has_section(module):
            self._parser.add_section(module)

        self._parser.set(module, property, value)

    def attr(self, key):
        """Accesses an attribute with the following format:

            module.property

        It splits the string and returns the property, or None if it does not
        exists.
        """

        match = CONFIG_ATTR_FORMAT.match(key)

        if not match:
            raise PyToolsError('Invalid key format')

        return self.get(match.group(2), opt_module=match.group(1))

    def set_attr(self, key, value):
        """Sets an attribute with the following format:

            module.property = value
        """

        match = CONFIG_ATTR_FORMAT.match(key)

        if not match:
            raise PyToolsError('Invalid key format')

        return self.set(value, match.group(2), opt_module=match.group(1))


###############################################################################
## SourceRepository

class SourceRepository (object):
    """Source repository handler.

    Finds sources and stores their state. Can compare two versions to notify
    about changes.
    """

    def __init__(self, name, config):
        """Initializes the repository."""

        self._db = config
        self._includes = None
        self._name = name
        self._root_dir = None
        self._signatures = None

    def load(self, root_dir, includes):
        """Initializes the repository.

        FIND_SRCS takes no argument and returns a list of source paths.
        """

        self._includes = includes
        self._root_dir = root_dir

        if not self._db.exists():
            # Let has_changed method do the job here
            return

        self._db.load()
        dump = self._db.get('sources', opt_module=self._name) or '{}'
        self._signatures = json.loads(dump)

    def _sources(self):
        """Builds the source list given the root_dir and the filter function.
        """

        sources = []

        for root, dirs, files in os.walk(self._root_dir):
            files = [os.path.join(root, f) for f in files]
            sources.extend([f for f in files if self._includes(f)])

        return sources

    def _save_baseline(self):
        """Writes the content of self._signatures into self._db if the former
        exists.
        """

        dump = json.dumps(self._signatures)
        self._db.set(dump, 'sources', opt_module=self._name)
        self._db.write()

    def _update_baseline(self):
        """Updates the content of self_signatures, saves the new baseline and
        returns the old one.
        """

        signatures = self._signatures
        self._signatures = self._build_signatures()
        self._save_baseline()

        return signatures

    def _build_signatures(self):
        """Lookup all sources and stores their state."""

        return {key: SourceRepository.digest(key) for key in self._sources()}

    def has_changed(self):
        """Lookup all sources, and compare with the previous state.
        The current state is updated during that operation.
        """

        old_signatures = self._update_baseline()

        if old_signatures is None:
            return True

        if len(old_signatures.keys()) != len(self._signatures.keys()):
            return True

        for (key, signature) in self._signatures.items():
            if old_signatures[key] != signature:
                return True

        return False

    @classmethod
    def digest(cls, path):
        """Returns the MD5 hash for the given file."""

        with open(path, 'r') as f:
            return hashlib.md5(f.read()).hexdigest()


###############################################################################
## Default configuration

Console.set_codes(DefaultCodes(AnsiForeground),
                  DefaultCodes(AnsiBackground),
                  DefaultCodes(AnsiStyle))

# If the terminal supports colored output - toggle it on

try:
    import curses

    if sys.stdout.isatty() and sys.stderr.isatty():
        curses.setupterm()

        FG = AnsiCodes(AnsiForeground)
        BG = AnsiCodes(AnsiBackground)
        STYLE = AnsiCodes(AnsiStyle)

        Console.set_codes(AnsiCodes(AnsiForeground),
                          AnsiCodes(AnsiBackground),
                          AnsiCodes(AnsiStyle))
        Console.set_advanced_output(True)

except:
    pass
