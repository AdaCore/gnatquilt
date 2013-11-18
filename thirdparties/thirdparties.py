#! /usr/bin/env python

# Fetch, build and install the thirdparty dependencies.

# It is the developer responsibility to select the correct sources to specify
# in the thirdparties.cfg config file. However, this config file ease the
# maintainability of all dependencies source which, de facto, helps ensuring
# that all dependencies have public visibility.

# The only dependency of this script is an installation of Python 2.7.

import argparse
import os
import re
import shutil
import signal
import sys
import urllib2

import ConfigParser

###############################################################################
## Constants

VERSION = (0, 0, 1)

BASE_DIR = os.path.dirname(os.path.realpath(sys.argv[0]))
DOWNLOAD_DIR = os.path.join(BASE_DIR, 'download')
DISTFILE_DIR = os.path.join(DOWNLOAD_DIR, 'distfiles')

DEFAULT_PYTHON_DIR = os.path.join(BASE_DIR, 'python')
# DEFAULT_INSTALL_DIR is a realpath since it is likely to be used as prefix for
# configure scripts.
DEFAULT_INSTALL_DIR = os.path.join(BASE_DIR, 'install')
DEFAULT_TOOLING_DIR = os.path.join(BASE_DIR, 'tooling')

CONFIG_FILE = os.path.join(BASE_DIR, 'thirdparties.cfg')

PHASES_HELP = """
lifecycle phases that can be executed w/ this tool:
  list                 list thirdparties for the current host
  python               create a python environment at ${python.prefix}
  fetch                download thirdparties - do nothing in offline mode
  build                build thirdparties (deflate, configure, make, ...)
  clean                clean up thirdparties - do nothing in offline mode
  distclean            remove download/, ${distrib.prefix}, ${tools.prefix} and
                       ${python.prefix} directories

default behavior (in sequencial order):
  python, fetch, build
"""

FORMAT_STRING_RE = re.compile('\${([0-9a-zA-Z_\-:]+)(\.[0-9a-zA-Z_\-\.]+)?}')
SVN_STATUS_OUTPUT_RE = re.compile('^.\s+(?P<file>.*)$')
CONTENT_DISPOSITION_RE = re.compile('attachment; filename="(?P<filename>.*)"')
COMPRESSED_TAR_FILE_EXT_RE = re.compile('.*?[.](?P<ext>tar\.gz|tar\.bz2|\w+)$')

SCRIPT_MANAGED_PREFIXES = ['tools.prefix', 'distrib.prefix', 'python.prefix']


###############################################################################
## Globals

kOffline = False
kDistribPrefixDir = DEFAULT_INSTALL_DIR
kProjectsBatch = None
kToolingPrefixDir = DEFAULT_TOOLING_DIR
kPythonDir = DEFAULT_PYTHON_DIR


###############################################################################
## Internals

# Import required modules

from pytools.common import AbstractMethod
from pytools.common import AutoLog
from pytools.common import Console
from pytools.common import ControlledTempDirectory
from pytools.common import ControlledUrlOpen
from pytools.common import ControlledWorkspace
from pytools.common import Deflator
from pytools.common import InferiorError
from pytools.common import InteractiveLogger
from pytools.common import Os
from pytools.common import Phase
from pytools.common import PhaseAutomator
from pytools.common import Process
from pytools.common import PyToolsError
from pytools.common import System
from pytools.common import override


###############################################################################
## CommandLine

class CommandLine(object):
    """Analyses the command line arguments.

    This class parses the arguments array and sets specific structure depending
    on the user input. It also provides several accessors to its attributes.
    """

    version = '%(prog)s ' + ('%i.%i.%i' % VERSION)

    def __init__(self):
        """Class constructor. Initializes the parser and sub-parsers."""

        super(CommandLine, self).__init__()

        # Create the parser object.
        self._parser = argparse.ArgumentParser(
            description=PHASES_HELP,
            formatter_class=argparse.RawDescriptionHelpFormatter)

        # Add the --version switch.
        self._parser.add_argument('--version', action='version',
                                  version=self.version)
        self._parser.add_argument('-v', '--verbose', action='store_true',
                                  default=False, help='toggle verbose output')
        self._parser.add_argument('-d', '--debug', action='store_true',
                                  default=False, help='toggle debug output')
        self._parser.add_argument('-o', '--offline', action='store_true',
                                  default=False, help='work offline')
        self._parser.add_argument('--with-python', metavar='DIST', nargs='?',
                                  help='use this python distribution',
                                  default=None)
        self._parser.add_argument('-p', '--projects', action='append',
                                  help='execute phases on these projects only')

        self._parser.add_argument('phases', nargs='*',
                                  help='phase(s) to execute')

    def parse(self, argv):
        """Parses the command line using the pre-initialized parsers, and
        returns the result.
        """

        self.result = self._parser.parse_args(argv)
        return self.result


###############################################################################
## ThirdpartiesError

class ThirdpartiesError(Exception):
    """Base class for internal errors."""


###############################################################################
## UserConfig

class UserConfig(object):
    """Configuration file loader."""

    def __init__(self, config_file=CONFIG_FILE):
        """Initializes the configuration object."""

        super(UserConfig, self).__init__()

        self._file = config_file
        self._parser = None

    def parse(self):
        """Parses the files given at initialization.
        Raise on exception on error.
        """

        self._parser = ConfigParser.SafeConfigParser(allow_no_value=False)
        successful_files = None

        with AutoLog('config', os.path.relpath(self._file)):
            try:
                self._set_default_values()
                successful_files = self._parser.read([self._file])
            except ConfigParser.ParsingError as e:
                Console.trace(str(e))

                raise ThirdpartiesError('Syntax error in config file ' +
                                        '(-v for details)')

            if successful_files is None or not len(successful_files):
                raise ThirdpartiesError('No configuration file found')

    def _set_default_values(self):
        """Manually fixes defaults value if not down in the config file."""

        if not self.safe_has_option('distrib', 'prefix'):
            if not self.has_section('distrib'):
                self._parser.add_section('distrib')
            self._parser.set('distrib', 'prefix', DEFAULT_INSTALL_DIR)

        if not self.safe_has_option('tools', 'prefix'):
            if not self.has_section('tools'):
                self._parser.add_section('tools')
            self._parser.set('tools', 'prefix', DEFAULT_TOOLING_DIR)

        if not self.safe_has_option('python', 'prefix'):
            if not self.has_section('python'):
                self._parser.add_section('python')
            self._parser.set('python', 'prefix', DEFAULT_PYTHON_DIR)

    def sections(self):
        """Wrapper to the #sections method."""
        return self._parser.sections()

    def options(self, section):
        """Wrapper to the #options method."""
        return self._parser.options(section)

    def items(self, section):
        """Wrapper to the #items method."""
        return self._parser.items(section)

    def has_section(self, section):
        """Returns True if the section exists."""
        assert self._parser is not None
        return self._parser.has_section(section)

    def has_option(self, section, option):
        """Returns True if the option exists for this section."""
        assert self._parser is not None
        return self._parser.has_option(section, option)

    def safe_has_option(self, section, option):
        """Returns True if the option exists for this section and False if the
        option OR the section does not exists.
        """

        assert self._parser is not None

        if not self._parser.has_section(section):
            return False

        return self._parser.has_option(section, option)

    def get(self, section, option):
        """Returns the value associated to the option of the given section."""
        assert self._parser is not None
        return self._parser.get(section, option)

    def safe_get(self, section, option):
        """Returns the value associated to the option of the given section or
        None if it does not exists.
        """

        assert self._parser is not None

        if (self._parser.has_section(section) and
                self._parser.has_option(section, option)):

            return self._parser.get(section, option)

        return None


###############################################################################
## ProjectDict

class ProjectDict(dict):
    """Custom dictionary containing projects as defined in the configuration
    file.
    """

    def __init__(self, dictionary):
        """Inherited Documentation."""

        super(ProjectDict, self).__init__()

        for (key, value) in dictionary.items():
            # We should have ensured that the keys can only be of the form:
            # %s.%s

            index = key.index('.')
            project = key[:index]
            attribute = key[index + 1:]

            if not project in self:
                self[project] = {}

            self[project][attribute] = value

    def has(self, project, attribute):
        """Returns True if the project contains the requested attribute."""

        if not project in self.keys():
            raise KeyError('%s not in dict' % project)

        return attribute in self[project].keys()

    def startswith(self, project, prefix):
        """Returns all keys for the given project that starts with PREFIX."""

        return [key for key in self[project].keys() if key.startswith(prefix)]

    def get(self, project, attribute):
        """Returns the value of the requested attribute from the given
        project.
        """

        if not project in self.keys():
            raise KeyError('%s not in dict' % project)

        if not attribute in self[project].keys():
            raise KeyError('%s not in %s' % (attribute, project))

        return self[project][attribute]

    def safe_get(self, project, attribute, default=None):
        """Returns the value of the requested attribute from the given
        project, or the default value provided. Do not raise any exception.
        """

        return self.get(project, attribute) if self.has(project, attribute) \
            else default


###############################################################################
## VCS

class VCS(object):
    """VCS interface."""

    def __init__(self, remote, repository, revision, switches=None):
        """Inherited Documentation."""

        super(VCS, self).__init__()

        self._remote = remote
        self._repository = repository
        self._revision = revision
        self._switches = switches

    def remote(self):
        """Returns the URL of the remote repository."""
        return self._remote

    def revision(self):
        """Returns the revision to fetch from the remote."""
        return self._revision

    def repository(self):
        """Returns the local repository path."""
        return self._repository

    def switches(self):
        """Returns optional additional switches for the checkout command
        line.
        """
        return self._switches

    def exists(self):
        """Returns True if the repository exists, False otherwise."""
        return os.path.exists(self._repository) and self.status()

    def status(self):
        """Returns True if the status is OK, False otherwise."""
        raise AbstractMethod('VCS.status <%s>' % self._repository)

    def checkout(self):
        """Checkouts the repository.
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('VCS.checkout <%s> <%s>' % (self._remote,
                                                         self._repository))

    def clean(self):
        """Completely cleans up the repository to left it as-if just
        checkout'd.
        """

        raise AbstractMethod('VCS.clean <%s>' % self._repository)

    def update(self):
        """Updates the repository.
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('VCS.update <%s>' % self._repository)

    @staticmethod
    def create(vcs, remote, repository, revision, switches=None):
        """Factory method to create concrete instances of VCS."""

        # Compare lowercase version of the user input to allow multiple version
        # of the same string, e.g. SVN, Svn, svn, ...

        if vcs.lower() == 'svn':
            return Subversion(remote, repository, revision, switches)

        elif vcs.lower() == 'git':
            return Git(remote, repository, revision, switches)

        else:
            raise ThirdpartiesError('VCS %s not supported' % vcs)


###############################################################################
## Subversion

class Subversion(VCS):
    """Subversion implementation of the VCS interface."""

    @override
    def __init__(self, remote, repository, revision=None, switches=None):
        """Inherited Documentation."""

        super(Subversion, self).__init__(remote, repository,
                                         revision or 'HEAD', switches)

    @override
    def status(self):
        """Inherited Documentation."""

        try:
            Os.spawn(['svn', 'status'], cwd=self._repository)

        except InferiorError as why:
            Console.trace(why.message)
            return False

        return True

    @override
    def checkout(self):
        """Inherited Documentation."""

        argv = ['svn', 'checkout']

        if self._switches:
            # Add optional switches, e.g. --recursive
            argv.extend(self._switches.split(' '))

        argv.extend(['-r%s' % self._revision, self._remote,
                     os.path.relpath(self._repository)])
        Os.spawn(argv)

    @override
    def clean(self):
        """Inherited Documentation."""

        out = Os.spawn(['svn', 'status', '--no-ignore'],
                       cwd=self._repository)[1]

        for line in out.splitlines():
            match = SVN_STATUS_OUTPUT_RE.match(line)

            if not match:
                Console.trace('Unexpected SVN output: ' + line)

            else:
                target = os.path.join(self._repository, match.group('file'))
                Console.trace('Removing file: ' + target)

                Os.safe_remove(target)

        self.update()

    @override
    def update(self):
        """Inherited Documentation."""

        Os.spawn(['svn', 'update', '-r%s' % self._revision],
                 cwd=self._repository)


###############################################################################
## Git

class Git(VCS):
    """Git implementation of the VCS interface."""

    @override
    def __init__(self, remote, repository, revision=None, switches=None):
        """Inherited Documentation."""

        super(Git, self).__init__(remote, repository, revision or 'HEAD',
                                  switches)

    @override
    def status(self):
        """Inherited Documentation."""

        try:
            Os.spawn(['git', 'status'], cwd=self._repository)

        except InferiorError as why:
            Console.trace(why.message)
            return False

        return True

    @override
    def checkout(self):
        """Inherited Documentation."""

        argv = ['git', 'clone']

        if self._switches:
            # Add optional switches, e.g. --recursive
            argv.extend(self._switches.split(' '))

        # ??? Take into account self._revision

        argv.extend([self._remote, os.path.relpath(self._repository)])
        Os.spawn(argv)

    @override
    def clean(self):
        """Inherited Documentation."""

        Os.spawn(['git', 'clean', '-fdx'], cwd=self._repository)

    @override
    def update(self):
        """Inherited Documentation."""

        Os.spawn(['git', 'pull', '--rebase'], cwd=self._repository)


###############################################################################
## Source

class Source(object):
    """A thirdparty source abstraction."""

    def url(self):
        """The endpoint for this source.
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('Source.url')

    def exists(self):
        """Returns True if the target has been fetched."""

        raise AbstractMethod('Source.exists')

    def target(self):
        """Returns the target directory for this source.
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('Source.target')

    def local_copy(self):
        """Returns the local copy for this source.
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('Source.local_copy')

    def fetch(self, force=False):
        """Fetches the thirdparty.
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('Source.fetch <%s>' % self.url())

    def clean(self):
        """Cleans the downloaded resources, if needed (e.g. for a VCS).
        Need to be implemented in the derived class.
        """

        raise AbstractMethod('Source.clean <%s>' % self.url())

    def create_workspace(self):
        """Returns a ControlledWorkspace object."""

        raise AbstractMethod('Source.create_workspace')

    @staticmethod
    def create(project_dict, project):
        """Factory method to create concrete instances of Source."""

        if project_dict.has(project, 'vcs') and \
                project_dict.has(project, 'url'):
            raise ThirdpartiesError('%s.vcs and %s.url ' % (project, project) +
                                    'are mutually exclusive')

        if project_dict.has(project, 'platform'):
            targets = project_dict.get(project, 'platform').split(' ')

            if not _host_platform_in(targets):
                return None

        if project_dict.has(project, 'vcs'):
            vcs_kind = project_dict.get(project, 'vcs')

            remote = project_dict.safe_get(project, 'remote')

            if remote is None:
                raise ThirdpartiesError('%s.remote attribute ' % project +
                                        'mandatory for VCS sources')

            revision = project_dict.safe_get(project, 'revision')
            switches = project_dict.safe_get(project, 'vcs.checkout.flags')

            repository = os.path.join(DOWNLOAD_DIR, project)
            vcs = VCS.create(vcs_kind, remote, repository, revision, switches)
            return VCSSource(vcs)

        elif project_dict.has(project, 'url'):
            deflate_opts = []

            if project_dict.has(project, 'deflate.opts'):
                deflate_attr = project_dict.get(project, 'deflate.opts')
                deflate_opts = deflate_attr.split(' ')

            return RemoteFileSource(project_dict.get(project, 'url'),
                                    os.path.join(DOWNLOAD_DIR, project),
                                    deflate_opts)

        else:
            Console.trace('Nothing to do with: %s' % project)
            return None


###############################################################################
## VCSSource

class VCSSource(Source):
    """An implementation of the Source interface for a VCS."""

    def __init__(self, vcs):
        """Inherited Documentation."""

        super(VCSSource, self).__init__()
        self._vcs = vcs

    @override
    def url(self):
        """Inherited Documentation."""

        return self._vcs.remote()

    @override
    def exists(self):
        """Inherited Documentation."""

        return (os.path.exists(self._vcs.repository()) and
                os.path.isdir(self._vcs.repository()))

    @override
    def target(self):
        """Inherited Documentation."""

        return self._vcs.repository()

    @override
    def local_copy(self):
        """Inherited Documentation."""

        return self._vcs.repository()

    @override
    def clean(self):
        """Inherited Documentation."""

        self._vcs.clean()

    @override
    def create_workspace(self):
        """Inherited Documentation."""

        return ControlledWorkspace(opt_cleanup=False,
                                   opt_dirname=self._vcs.repository())

    @override
    def fetch(self, force=False, logger=None):
        """Inherited Documentation."""

        Console.trace('Repository: %s' % self._vcs.repository())

        if self._vcs.exists():
            self._vcs.update()
        else:
            self._vcs.checkout()


###############################################################################
## RemoteFileSource

class RemoteFileSource(Source):
    """An implementation of the Source interface for a downloadable archive."""

    def __init__(self, url, target, deflate_opts=[]):
        """Inherited Documentation."""

        super(RemoteFileSource, self).__init__()

        self._url = url
        self._target = target
        self._deflate_opts = deflate_opts
        self._distfile = os.path.join(DISTFILE_DIR,
                                      os.path.basename(target) + '.tar.gz')

    @override
    def url(self):
        """Inherited Documentation."""

        return self._url

    @override
    def exists(self):
        """Inherited Documentation."""

        return (os.path.exists(self._distfile) and
                Deflator.is_archive(self._distfile))

    @override
    def target(self):
        """Inherited Documentation."""

        return self._target

    @override
    def local_copy(self):
        """Inherited Documentation."""

        return self._distfile

    @override
    def clean(self):
        """Inherited Documentation."""

        # Nothing to do, workspace is created on the fly in a temporary
        # directory during the build phase.
        pass

    @override
    def create_workspace(self):
        """Inherited Documentation."""

        return ControlledWorkspace(opt_tarball=self._distfile,
                                   opt_guess_root_dir=True)
                                   # opt_subdir=os.path.basename(self._target))

    @staticmethod
    def read(remote_file, output, logger=None, chunk_size=8192):
        """Reads the remote file by chunks to allow a report function to be
        hooked while downloading.
        """

        content_lenght = remote_file.info().getheader('Content-Length')

        if content_lenght is not None:
            total_size = content_lenght.strip()
            total_size = int(total_size)

            Console.trace('Total size to download: %0.2fMb' %
                          (float(total_size) / (1024 * 1024)))

        bytes_so_far = 0

        while True:
            chunk = remote_file.read(chunk_size)
            output.write(chunk)

            bytes_so_far += len(chunk)

            if not chunk:
                break

            if content_lenght is not None and logger is not None:
                logger.progress((float(bytes_so_far) / total_size) * 100)

        return bytes_so_far

    @override
    def fetch(self, force=False, logger=None):
        """Inherited Documentation."""

        if os.path.exists(self._distfile):
            Console.trace('Cached: ' + self._distfile)
            return

        remote_file = None

        try:
            with ControlledTempDirectory() as tempdir:
                with ControlledUrlOpen(self._url) as remote_file:

                    fname = RemoteFileSource.get_remote_file_name(remote_file)
                    tmp_distfile = os.path.join(tempdir, fname)

                    Console.trace('Downloading: %s' % tmp_distfile)

                    with open(tmp_distfile, 'wb') as distfile:
                        RemoteFileSource.read(remote_file, distfile, logger)

                rootdir = os.path.basename(self._target)
                distdir = os.path.join(tempdir, rootdir)

                Os.makedirs(distdir)

                if Deflator.is_archive(tmp_distfile):
                    Console.trace('Deflating downloaded file: ' +
                                  self._distfile)

                    Deflator.deflate(tmp_distfile, distdir,
                                     'remove_root_dir' in self._deflate_opts)
                else:
                    assert os.path.isfile(tmp_distfile)
                    shutil.move(tmp_distfile, distdir)

                Console.trace('Repackaging: ' + self._distfile)
                Os.package(distdir, self._distfile)

        except urllib2.HTTPError as why:
            raise ThirdpartiesError('HTTP error: %s' % str(why))

    @staticmethod
    def get_remote_file_name(remote_file):
        CONTENT_DISPOSITION = 'Content-Disposition'
        info = remote_file.info()

        # Attempt to retreive the filename from the HTTP headers
        if CONTENT_DISPOSITION in info:
            content_disposition = info.get(CONTENT_DISPOSITION)
            match = CONTENT_DISPOSITION_RE.match(content_disposition)

            if match:
                return match.group('filename')

        # Fallback on guessing the filename from the URL
        return remote_file.geturl().split('/')[-1].split('#')[0].split('?')[0]


###############################################################################
## BuildStep

class BuildStep(object):
    """Interface for a step into building the thirdparty."""

    def set_up(self, cwd):
        """Set up the step."""

        pass

    def execute(self, cwd):
        """Runs this step."""

        raise AbstractMethod('BuildStep.execute')

    def tear_down(self, cwd):
        """Set up the step."""

        pass

    @staticmethod
    def create(project_dict, project, release=False):
        """Factory method to create concrete instances of Source."""

        steps = []

        if project_dict.has(project, 'configure'):
            cmdline = project_dict.get(project, 'configure')
            steps.append(ConfigureStep(Process.normalize_cmdline(cmdline)))

        if project_dict.has(project, 'make'):
            cmdline = project_dict.get(project, 'make')
            steps.append(MakefileStep(Process.normalize_cmdline(cmdline)))

        if project_dict.has(project, 'setup.py'):
            cmdline = project_dict.get(project, 'setup.py')
            steps.append(PythonInstallStep(Process.normalize_cmdline(cmdline),
                                           release))

        for (base, prefix) in (('distrib', kDistribPrefixDir),
                               ('tools', kToolingPrefixDir)):

            for key in project_dict.startswith(project, base):
                index = key.find('.')

                if index == -1:
                    # Found an INSTALL rule
                    srcs = Process.normalize_cmdline(project_dict.get(project,
                                                                      base))
                    steps.append(InstallStep(srcs, prefix))

                else:
                    assert key[:index] == base, ('Expected "%s", found: %s'
                                                 % (base, key[:index]))

                    dst = key[index + 1:]

                    srcs = project_dict.get(project, '%s.%s' % (base, dst))
                    steps.append(InstallStep(Process.normalize_cmdline(srcs),
                                             os.path.join(prefix, dst)))

        return steps if len(steps) else None


###############################################################################
## ConfigureStep

class ConfigureStep(BuildStep):
    """Runs the configure script w/ the correct command line options."""

    def __init__(self, switches=[]):
        """Inherited Documentation."""

        super(ConfigureStep, self).__init__()
        self._switches = switches

    @override
    def execute(self, cwd):
        """Inherited Documentation."""

        shellopts = None

        if System.windows:
            # Assuming Cygwin base installation
            shellopts = ['-o', 'igncr']

        argv = ['sh']

        if shellopts:
            argv.extend(shellopts)

        argv.append('configure')
        argv.extend(self._switches)

        Os.spawn(argv, cwd=cwd)


###############################################################################
## MakefileStep

class MakefileStep(BuildStep):
    """Runs make using the thirdparty Makefile and the provided options."""

    def __init__(self, cmdline=[]):
        """Inherited Documentation."""

        super(MakefileStep, self).__init__()
        self._cmdline = cmdline

    @override
    def execute(self, cwd):
        """Inherited Documentation."""

        argv = ['make']
        argv.extend(self._cmdline)

        Os.spawn(argv, cwd=cwd)


###############################################################################
## InstallStep

class InstallStep(BuildStep):
    """Runs make using the thirdparty Makefile and the provided options."""

    def __init__(self, srcs, dst):
        """Inherited Documentation."""

        super(InstallStep, self).__init__()
        self._srcs = srcs
        self._dst = dst

    @override
    def execute(self, cwd):
        """Inherited Documentation."""

        Os.makedirs(self._dst)
        [Os.install(os.path.join(cwd, src), self._dst) for src in self._srcs]


###############################################################################
## PythonInstallStep

class PythonInstallStep(BuildStep):
    """Runs make using the thirdparty Makefile and the provided options."""

    def __init__(self, cmdline=[], release=False):
        """Inherited Documentation."""

        super(PythonInstallStep, self).__init__()
        self._cmdline = cmdline
        self._release = release

    @override
    def execute(self, cwd):
        """Inherited Documentation."""

        if not os.path.exists(os.path.join(cwd, 'setup.py')):
            raise ThirdpartiesError('Cannot find setup.py')

        pbin = None

        if System.windows:
            pbin = os.path.join(kPythonDir, 'python')
        else:
            pbin = os.path.join(kPythonDir, 'bin', 'python')

        # Use directly PYTHON binary since we should have changed environment
        # at the beginning of the build phase.
        argv = [pbin, 'setup.py']
        argv.extend(self._cmdline)

        if not self._release:
            # See http://docs.python.org/2/install/index.html
            #        #alternate-installation-the-home-scheme

            python_prefix = os.path.join(kToolingPrefixDir, 'python')
            lib_dir = os.path.join(python_prefix, 'lib', 'python')

            Os.makedirs(python_prefix)
            Os.makedirs(lib_dir)

            Os.append_env('PYTHONPATH', lib_dir, System.escape_path)

            argv.append('--home=' + python_prefix)

        Os.spawn(argv, cwd=cwd)

    @override
    def tear_down(self, cwd):
        """Inherited Documentation."""

        python_env = os.path.relpath(kPythonDir)
        activate = os.path.join(python_env,
                                'Scripts' if System.windows else 'bin',
                                'activate_this')

        if os.path.exists(activate):
            # The existence of the activate_this scripts is proof of a virtual
            # environment.
            Console.trace('Run virtualenv --relocatable after module install')
            Os.spawn(['virtualenv', '--relocatable', python_env])


###############################################################################
## Thirdparty

class Thirdparty(object):
    """Thirdparty interface."""

    def __init__(self, name, source, release=False, depends=[]):
        super(Thirdparty, self).__init__()
        self._name = name
        self._source = source
        self._release = release
        self._depends = depends
        self._build_steps = []

    def name(self):
        """The name of this thirdparty object."""

        return self._name

    def source(self):
        """The source for this thirdparty."""

        return self._source

    def is_release(self):
        """Whether the thirdparty is a tool or is part of the release."""

        return self._release

    def depends(self):
        """The list of dependency for this thirdparty."""

        return self._depends

    def add_build_step(self, build_step):
        """Adds a build step to the chain of build."""

        self._build_steps.append(build_step)

    def has_build(self):
        """Returns True if build step(s) are in the pipe."""

        return self._build_steps

    def fetch(self, force=False, logger=None):
        """Fetches the thirdparty."""

        self._source.fetch(force, logger=logger)

    def build(self, workspace):
        """Builds the thirdparty.
        Need to be implemented in the derived class.
        """

        for step in self._build_steps:
            step.set_up(workspace)
            step.execute(workspace)
            step.tear_down(workspace)


###############################################################################
## Helpers

def _host_platform_in(platforms):
    """Returns True if the host platform is referenced in the PLATFORMS array
    passed as parameter.
    Returns False otherwise.
    """

    for arch_id in System.get_arch_identifiers():
        if arch_id in platforms:
            return True

    return False


def _extract_extension(filename):
    """Returns the extension of a filename.
    Contrary to os.path.splitext, this function is aware of the following
    extensions:
        * .tar.gz
        * .tar.bz2
    """

    match = COMPRESSED_TAR_FILE_EXT_RE.match(filename)
    return match.group('ext') if match else os.path.splitext(filename)


def _change_python_env(env):
    """Activates the ENV python env."""

    activate = None

    if System.windows:
        activate = os.path.join(env, 'activate_this.py')
    else:
        activate = os.path.join(env, 'bin', 'activate_this.py')

    execfile(activate, dict(__file__=activate))


def _compile_config(user_config):
    """Extracts platform specific information from the config file, and
    resolves internal references to attributes.
    """

    dictionary = {}

    # Sort sections to ensure that 'package.linux' is found before 'package'
    for section in sorted(user_config.sections()):
        split = section.split('.')

        if len(split) > 2:
            raise ThirdpartiesError('Ill-formated section: %s' % section)

        if len(split) == 2:
            if split[1] in System.get_arch_identifiers():
                for option in user_config.options(section):
                    assert user_config.has_option(section, option)
                    dictionary['%s.%s' % (split[0], option)] = \
                        user_config.get(section, option)

            else:
                # Drop values that are not for the host architecture
                Console.trace('Unsued value: %s.%s' % (split[0], split[1]))
                pass

        else:
            for option in user_config.options(section):
                assert user_config.has_option(section, option)
                dictionary['%s.%s' % (section, option)] = \
                    user_config.get(section, option)

    for (key, value) in dictionary.items():
        while True:
            match = FORMAT_STRING_RE.search(value)

            if not match:
                break

            substrate = ''.join(match.groups())
            original = substrate

            norm_flags = substrate.startswith('norm:')

            if norm_flags:
                substrate = substrate[5:]

            try:
                substitute = ''

                if substrate in SCRIPT_MANAGED_PREFIXES:
                    assert substrate in dictionary

                    # Compute the realpath in case of user defined path
                    substitute = os.path.realpath(dictionary[substrate])

                    if not norm_flags:
                        substitute = System.normalize_path(substitute)

                elif substrate in dictionary:
                    substitute = dictionary[substrate]

                else:
                    Console.trace('No substitute found for ' + substrate)

                value = value.replace('${%s}' % original, substitute)

                assert value != dictionary[key], \
                    'Substitution failed: ' + substrate
                dictionary[key] = value

            except KeyError:
                raise ThirdpartiesError('Unknown key: %s' % substrate)

    return ProjectDict(dictionary)


def _order_thirdparties(db, outgoing):
    """Use a topological sort on the input list of thirdparties and returns
    a new list which can be processed into a valid sequence from a
    dependency point of view.
    """

    # Initialize the incoming edges dict
    incoming = {p: [] for p in db.keys()}
    [[incoming[d].append(k) for d in outgoing[k]] for k in db.keys()]

    # Set of all thirdparties w/ no dependency
    depfree = [v for v in db.values() if not incoming[v.name()]]

    # Emtpy list that will contain the sorted elements
    ordered = []

    Console.trace('Topologically sorting thirdparties...')

    while depfree:
        p = depfree.pop()
        ordered.append(p)

        for child in outgoing[p.name()]:
            incoming[child].remove(p.name())

            if not incoming[child]:
                depfree.append(db[child])

    Console.trace('Found the following order (%d packages):' % len(ordered))
    Console.trace(['  - ' + e.name() for e in ordered])

    return ordered


def _thirdparties_db(user_config):
    """Generates the internal thirdparties database from the config file."""

    defs = _compile_config(user_config)

    assert defs.has('distrib', 'prefix')
    assert defs.has('python', 'prefix')
    assert defs.has('tools', 'prefix')

    global kDistribPrefixDir
    kDistribPrefixDir = defs.get('distrib', 'prefix')

    global kToolingPrefixDir
    kToolingPrefixDir = defs.get('tools', 'prefix')

    global kPythonDir
    kPythonDir = os.path.realpath(defs.get('python', 'prefix'))

    # Thirdparty database
    db = {}

    for project in sorted(defs.keys()):
        # Scan the configuration of project PROJECT to determine its source
        # (e.g. VCS, downloadable archive, ...)

        if defs.has(project, 'vcs') and defs.has(project, 'url'):
            raise ThirdpartiesError('%s.vcs and %s.url ' % (project, project) +
                                    'are mutually exclusive')

        source = Source.create(defs, project)

        if source is None:
            Console.trace('Could not find a source for: ' + project)
            continue

        # Whether the thirdparty is a tool or is part of the release
        release = False

        if defs.has(project, 'release') and \
                defs.get(project, 'release').lower() in ('yes', 'true'):
            release = True

        # Create the thirdparty
        thirdparty = Thirdparty(project, source, release)

        # Compute build steps if any
        build_steps = BuildStep.create(defs, project, release)

        if build_steps is not None:
            [thirdparty.add_build_step(step) for step in build_steps]

        Console.trace('Register thirdparty: ' + project)
        db[project] = thirdparty

    # Object containing order information about the thirdparties package.
    # This is used by _order_thirdparties to do the topsort.
    # It corresponds to the outgoing vertices for each node of the thirdparty
    # graph.
    outgoing = {project: [] for project in db.keys()}

    for project in db.keys():
        depends = []

        if defs.has(project, 'depends'):
            # Retrieve the list of all specified dependencies
            all_deps = defs.get(project, 'depends').split(' ')

            # Extract the list of known dependencies
            depends = [d for d in all_deps if d in db.keys()]

            # Set the edge in the outgoing dict
            [outgoing[d].append(project) for d in depends]

    # Returns a list of thirdparties order by dependencies
    return _order_thirdparties(db, outgoing)


def _filter_thirdparties_from_cmdline(db):
    """If the user used one or more '--project' switches on the command line,
    this function filter out the list of projects to process to keep only those
    specified by the user. Returns DB otherwise.

    NOTE: _set_up function needs to be called before this function in order to
    retrieve the command line options.
    """

    if not kProjectsBatch:
        return db

    known_projects = [p.name() for p in db]

    for name in kProjectsBatch:
        if not name in known_projects:
            raise ThirdpartiesError('Unknown project: ' + name)

    return [p for p in db if p.name() in kProjectsBatch]


###############################################################################
## ThirdpartyPhase

class ThirdpartyPhase(Phase):
    """Implementation of the generic interface for the thirdparty module."""

    def __init__(self, name):
        super(ThirdpartyPhase, self).__init__(name)


###############################################################################
## CleanPhase

class CleanPhase(ThirdpartyPhase):
    """Implementation of the generic interface for the CLEAN phase."""

    def __init__(self):
        super(CleanPhase, self).__init__('clean')

    @override
    def execute(self, **kwargs):
        """Inherited Documentation.

        Clean up the thirdparty sources. This phase does nothing if the offline
        switch is on since it might need to fetch additional information online
        (e.g. subversion for the update needed by the clean step).
        """

        if 'thirdparties' not in kwargs:
            raise ThirdpartiesError('Missing "thirdparties" parameter')

        for package in kwargs['thirdparties']:
            with AutoLog('clean', package.name()):
                package.source().clean()


###############################################################################
## DistcleanPhase

class DistcleanPhase(ThirdpartyPhase):
    """Implementation of the generic interface for the CLEAN phase."""

    def __init__(self):
        super(DistcleanPhase, self).__init__('distclean')

    @override
    def execute(self, **kwargs):
        """Inherited Documentation.

        Clean up the thirdparty directory by entirely removing the download,
        distfiles and install directories.
        """

        for path in [DISTFILE_DIR, DOWNLOAD_DIR, kPythonDir,
                     kDistribPrefixDir, kToolingPrefixDir]:
            if os.path.exists(path):
                with AutoLog('distclean', path):
                    Os.rmtree(path)


###############################################################################
## ListPhase

class ListPhase(ThirdpartyPhase):
    """Implementation of the generic interface for the LIST phase."""

    def __init__(self):
        super(ListPhase, self).__init__('list')

    @override
    def execute(self, **kwargs):
        """Inherited Documentation.

        Lists all thirdparties that will need to be processed.
        This can vary depending on the host.
        """

        if 'thirdparties' not in kwargs:
            raise ThirdpartiesError('Missing "thirdparties" parameter')

        for p in kwargs['thirdparties']:
            Console.info('source: ' + p.source().url())
            Console.info('release:' + str(p.is_release()))


###############################################################################
## PythonPhase

class PythonPhase(ThirdpartyPhase):
    """Implementation of the generic interface for the BUILD phase."""

    def __init__(self, distfile=None):
        super(PythonPhase, self).__init__('python')

        self._distfile = distfile

    @override
    def execute(self, **kwargs):
        """Inherited Documentation."""

        # Relative path to avoid issue on Windows (cygwin)
        pyenv = os.path.relpath(kPythonDir)

        if os.path.exists(kPythonDir):
            # Do not override previous installation
            InteractiveLogger('python', 'found env: ' + pyenv).completed()
            return

        if not self._distfile:
            # If no python distribution is provided through the command line
            # but a python.tar.gz distfile exists, use this file as python
            # binary distribution.

            alt_distfile = os.path.join(BASE_DIR, 'download', 'distfiles',
                                        'python.tar.gz')

            if os.path.exists(alt_distfile):
                self._distfile = alt_distfile

        if self._distfile:
            # Deflate the tarball containing the environment

            if not Deflator.is_archive(self._distfile):
                raise ThirdpartiesError('Invalid python archive')

            with AutoLog('python', 'installing env: ' + pyenv):
                Deflator.deflate(self._distfile, pyenv, remove_root_dir=True)

        else:
            # Create a virtual environment

            venv = 'virtualenv'

            create = [venv, '--never-download', '--no-site-package', pyenv]
            finalize = [venv, '--relocatable', pyenv]

            with AutoLog('python', 'virtualenv: ' + pyenv):

                Os.spawn(create)
                Os.spawn(finalize)

                if System.windows:
                    # Creation of a virtual environment is slightly more
                    # complicated on Windows since we need some libraries
                    # to be in the environment to build and execute.

                    dll = 'python%d%d.dll' % sys.version_info[:2]

                    bin_dir = os.path.join(pyenv, 'bin')
                    Os.makedirs(bin_dir)

                    libs_dir = os.path.join(pyenv, 'libs')
                    Os.makedirs(libs_dir)

                    def _ignore_lib(src, names):
                        """Returns a list of all filenames with the extension
                        '.lib'.
                        """

                        return [name for name in names
                                if os.path.splitext(name)[1] == '.lib']

                    # Copy python executable to the environment root
                    Console.trace('Copying python.exe in: ' + pyenv)
                    shutil.copy2(os.path.join(pyenv, 'Scripts', 'python.exe'),
                                 pyenv)

                    # Copy python dll in the bin directory
                    Console.trace('Copying %s in: %s' % (dll, bin_dir))
                    dll_path = Os.spawn(['which', dll])[1]
                    shutil.copy2(System.escape_path(dll_path), bin_dir)

                    # Copy the system installation libs directory, excluding
                    # *.lib
                    Console.trace('Copying libs in: ' + libs_dir)
                    Os.install_dir(os.path.join(sys.prefix, 'libs'), libs_dir,
                                   ignore=_ignore_lib)


###############################################################################
## FetchPhase

class FetchPhase(ThirdpartyPhase):
    """Implementation of the generic interface for the FETCH phase."""

    def __init__(self):
        super(FetchPhase, self).__init__('fetch')

    @override
    def execute(self, **kwargs):
        """Inherited Documentation."""

        if kOffline:
            InteractiveLogger('fetch', 'offline mode').skipped()
            return

        # Create needed directories (download/distfiles).
        # Distfiles directory needed only if we intend to fetch anything.
        Os.makedirs(DISTFILE_DIR)

        if 'thirdparties' not in kwargs:
            raise ThirdpartiesError('Missing "thirdparties" parameter')

        for package in kwargs['thirdparties']:
            with AutoLog('fetch', package.name()) as logger:
                package.fetch(force=False, logger=logger)


###############################################################################
## BuildPhase

class BuildPhase(ThirdpartyPhase):
    """Implementation of the generic interface for the BUILD phase."""

    def __init__(self):
        super(BuildPhase, self).__init__('build')

    @override
    def execute(self, **kwargs):
        """Inherited Documentation."""

        if 'thirdparties' not in kwargs:
            raise ThirdpartiesError('Missing "thirdparties" parameter')

        for package in kwargs['thirdparties']:
            # Do NOT raise an error when the source has not been fetched,
            # simply skip the build.

            if package.source().exists() and package.has_build():
                with AutoLog('build', package.name()):
                    with package.source().create_workspace() as workspace:
                        package.build(workspace)

            else:
                InteractiveLogger('build', package.name()).skipped()


###############################################################################
## Glue

def _sigint_handler(sig, frame):
    """Handle KeyboardInterrupt exception properly."""

    if sig == signal.SIGINT:
        Console.newline()
        Console.err('Keyboard Interruption caught, exiting...', newline=True)

        _tear_down(1)

    else:
        Console.trace('Ignoring signal: %s' % sig)


def _set_up(cmdline):
    """Script's set up procedure.
    Sets global using value from the command line, registers phases, and ensure
    user requests valid phases (from the command line).
    """

    Console.init(tool='3rdparty')
    Console.log_start('GNATquilt Thirdparties')

    # Set up the KeyboardInterrupt handler
    signal.signal(signal.SIGINT, _sigint_handler)

    # Set console verbosity
    Console.set_debug(cmdline.debug)
    Console.set_verbose(cmdline.verbose or cmdline.debug)

    global kOffline
    kOffline = cmdline.offline

    global kProjectsBatch
    if cmdline.projects:
        kProjectsBatch = []
        for p in cmdline.projects:
            kProjectsBatch.extend(p.split(','))

    Os.append_env('GPR_PROJECT_PATH',
                  os.path.join(kToolingPrefixDir, 'lib', 'gnat'),
                  formatter=System.normalize_path)

    python_phase = PythonPhase() if not cmdline.with_python \
        else PythonPhase(distfile=cmdline.with_python)

    PhaseAutomator.register(ListPhase())
    PhaseAutomator.register(python_phase, default=True)
    PhaseAutomator.register(FetchPhase(), default=True)
    PhaseAutomator.register(BuildPhase(), default=True)
    PhaseAutomator.register(CleanPhase())
    PhaseAutomator.register(DistcleanPhase())

    for phase in cmdline.phases:
        if phase not in PhaseAutomator.registered_phase_ids():
            raise ThirdpartiesError('Unknown phase: ' + phase)


def _tear_down(exit_code):
    """Script's tear down procedure.
    Computes ellapsed time and displays good bye message depending on the
    script exit code.
    Exits using this exit code. This function should not raise SystemExit
    exception when exiting.
    """

    Console.log_end(exit_code == 0)

    # Use os._exit instead of sys.exit to avoid raising a SystemExit exception
    # that would be caught by the exception handlers guarding the main
    # procedure.

    os._exit(exit_code)


###############################################################################
## Entry Point

if __name__ == '__main__':
    try:
        # Parse the command line
        cmdline = CommandLine().parse(sys.argv[1:])

        # Set up phase
        _set_up(cmdline)

        # Parse the thirdparties.cfg configuration file
        config = UserConfig()
        config.parse()

        # Build the thirdparties database from config file
        db = _thirdparties_db(config)

        # Keep only projects specified by --project on the commandline,
        # otherwise leave DB unchanged.
        db = _filter_thirdparties_from_cmdline(db)

        # Run all requested phases w/ this database
        PhaseAutomator.run_sequentially(cmdline.phases, thirdparties=db)

    except InferiorError as why:
        # Inferior error
        Console.newline(stream=sys.stderr)
        Console.err('Subprocess error: %s' % why.message, newline=True)
        Console.print_stack_trace()
        _tear_down(why.exit_code)

    except PyToolsError as why:
        # Consistency error caused by an issue specific to this script, e.g.
        # issue w/ the configuration phase, w/ the command line, ...
        Console.newline(stream=sys.stderr)
        Console.err('Workflow error: %s' % str(why), newline=True)
        Console.print_stack_trace()
        _tear_down(1)

    except ThirdpartiesError as why:
        # Consistency error caused by an issue specific to this script, e.g.
        # issue w/ the configuration phase, w/ the command line, ...
        Console.newline(stream=sys.stderr)
        Console.err('Workflow error: %s' % str(why), newline=True)
        Console.print_stack_trace()
        _tear_down(1)

    except Exception as why:
        # Unexpected error raised by the different layers of abstraction used
        # by this script, which should probably be caught and handle properly
        # if not an internal error.
        Console.newline(stream=sys.stderr)
        Console.err('Unexpected error: %s' % str(why), newline=True)
        Console.print_stack_trace()
        _tear_down(1)

    _tear_down(0)
