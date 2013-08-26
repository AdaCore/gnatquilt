import os
import sys

try:
    # Try and import the bs4 module. If this fails, simply exit since this is
    # mandatory for execution.
    from bs4 import BeautifulSoup
except:
    print >>sys.stderr, 'Missing dependency: BeautifulSoup, aborting...'
    sys.exit(1)


class __ControlledChangeDirectory(object):
    """Provides custom __enter__ and __exit__ methods for use in a with
    clause.
    """

    def __init__(self, directory):
        self.directory = directory
        self.home = os.getcwd()

    def __enter__(self):
        os.chdir(self.directory)

    def __exit__(self, type, value, traceback):
        os.chdir(self.home)


def bundleHTMLReport(report, stream=sys.stdout):
    """Rewrites the HTML report by replacing the included dependency files by
    their actual content.

    :param: report The path to the report file.
    :param: stream The output stream in which to dump the string result.
    """

    html = BeautifulSoup(open(report, 'r'))

    with __ControlledChangeDirectory(os.path.dirname(report)):
        for link in html.find('head').findAll('link'):
            tag = html.new_tag('style')
            tag.append(open(link['href']).read())
            link.replaceWith(tag)

        for script in html.find('head').findAll('script'):
            script.string = open(script['src']).read()
            del script['src']

    print >>stream, html


# Python main
if __name__ == '__main__':
    """Creates a bundled file.

    Takes an HTML file as input and inlines both link and scripts tag in the
    header section of the document.
    Prints the result either on the standard output or dumps it in the specified
    file (throught the script second command-line parameter).
    """

    if len(sys.argv) < 2 and len(sys.argv) > 3:
        print >>sys.stderr, 'Error: Expected one or two arguments.'
        print >>sys.stderr, ('Usage: %s <index.html> [<output.html>]'
                             % os.path.basename(sys.argv[0]))
        sys.exit(1)

    stream = open(sys.argv[2], 'w') if len(sys.argv) == 3 else sys.stdout
    bundleHTMLReport(sys.argv[1], stream=stream)

    sys.exit(0)
