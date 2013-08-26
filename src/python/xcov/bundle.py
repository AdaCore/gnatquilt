import os
import sys

try:
    from bs4 import BeautifulSoup, Tag
except:
    print >>sys.stderr, 'Missing dependency: BeautifulSoup, aborting...'
    sys.exit(1)


def bundleHTMLReport(report, stream=sys.stdout):
    """Rewrites the HTML report by replacing the included dependency files by
    their actual content.

    :param: report The path to the report file.
    """

    html = BeautifulSoup(open(report, 'r'))
    home = os.getcwd()

    os.chdir(os.path.dirname(report))

    for link in html.find('head').findAll('link'):
        tag = html.new_tag('style')
        tag.append(open(link['href']).read())
        link.replaceWith(tag)

    for script in html.find('head').findAll('script'):
        script.string = open(script['src']).read()
        del script['src']

    print >>stream, html


if __name__ == '__main__':
    if len(sys.argv) < 2 and len(sys.argv) > 3:
        print >>sys.stderr, 'Error: Expected one or two arguments.'
        print >>sys.stderr, ('Usage: %s <index.html> [<output.html>]'
                             % os.path.basename(sys.argv[0]))
        sys.exit(1)

    stream = sys.stdout

    if len(sys.argv) == 3:
        stream = open(sys.argv[2], 'w')

    bundleHTMLReport(sys.argv[1], stream=stream)
    sys.exit(0)
