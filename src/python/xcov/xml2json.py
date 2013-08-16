import json
import os
import xml.sax.handler

(NO_CODE, COVERED, PARTIALLY_COVERED, NOT_COVERED, EXEMPTED_NO_VIOLATION,
 EXEMPTED_WITH_VIOLATION) = ('.', '+', '!', '-', '#', '*')

class Trace(object):
    """Represents a trace object as read in the XML file.
    Contains 4 mandatory attributes:
        - filename
        - program
        - date
        - tag
    """

    def __init__(self, filename, program, date, tag):
        """Trace Ctor."""
        self.filename = filename
        self.program = program
        self.date = date
        self.tag = tag

    def toJSON(self):
        """Returns a object representation of this object.
        This mechanism is used for dumping the object in JSON format.
        """

        return {
            'filename': self.filename,
            'program': self.program,
            'date': self.date,
            'tag': self.tag
        }


class Line(object):
    """Represents a line object as read in the XML file.
    Contains 1 mandatory field:
        - number

    And 4 optional attributes:
        - source
        - exempted
        - col_begin
        - col_end
    """

    def __init__(self, number, source=None, exempted=None, col_begin=None,
                 col_end=None):
        """Line Ctor."""
        self.number = number
        self.source = source
        self.exempted = exempted
        self.col_begin = col_begin
        self.col_end = col_end

    def toJSON(self):
        """Returns a object representation of this object.
        This mechanism is used for dumping the object in JSON format.
        """

        return {
            'number': self.number,
            'src': self.source if self.source is not None else 'null',
            'exempted': self.exempted if self.exempted is not None else 'null'
        }


class SourceRange(object):
    """Represents a source range as read in the XML file.
    Contains 3 mandatory fields:
        - id
        - text
        - coverage

    Also provides a list of related lines.
    """

    def __init__(self, uid, text, coverage):
        """SourceRange Ctor."""
        self.uid = uid
        self.text = text
        self.coverage = coverage
        self.lines = []

    def toJSON(self):
        """Returns a object representation of this object.
        This mechanism is used for dumping the object in JSON format.
        """

        begin = self.lines[0]
        end = self.lines[-1]

        r = ((begin.number, begin.col_begin), (end.number, end.col_end))

        return {
            'id': self.uid,
            'text': self.text,
            'coverage': self.coverage,
            'range': r
        }


class Statement(SourceRange):
    """Represents a statement object as read in the XML file.
    Contains 3 mandatory fields:
        - id
        - text
        - coverage

    Also provides a list of related lines.
    """

    def __init__(self, uid, text, coverage):
        """Statement Ctor."""
        super(Statement, self).__init__(uid, text, coverage)


class Decision(SourceRange):
    """Represents a statement object, derived from the Statement declaration.
    It contains an additional list of related conditions.
    """

    def __init__(self, uid, text, coverage):
        """Decision Ctor."""
        super(Decision, self).__init__(uid, text, coverage)
        self.conditions = []

    def toJSON(self):
        """Inherited."""

        obj = super(Decision, self).toJSON()
        obj['conditions'] = [c.toJSON() for c in self.conditions]

        return obj


class Condition(SourceRange):
    """Represents a statement object, derived from the Statement declaration."""

    def __init__(self, uid, text, coverage):
        """Condition Ctor."""
        super(Condition, self).__init__(uid, text, coverage)


class Message(object):
    """Represents a message object as read in the XML file.
    Contains 3 mandatory attributes:
        - kind
        - sco
        - message
    """

    def __init__(self, kind, sco, message):
        """Message Ctor."""
        self.kind = kind
        self.sco = sco
        self.message = message

    def toJSON(self):
        """Returns a object representation of this object.
        This mechanism is used for dumping the object in JSON format.
        """

        return {
            'kind': self.kind,
            'sco': self.sco,
            'message': self.message
        }


class SourceMapping(object):
    """Represents a message object as read in the XML file.
    Contains 1 mandatory attribute:
        - coverage

    Also provides:
        - a list of line
        - a list of statement
        - a list of decisions
    """

    def __init__(self, coverage):
        """SourceMapping Ctor."""
        self.coverage = coverage
        self.lines = []
        self.statements = []
        self.decisions = []
        self.message = None

    def toJSON(self):
        """Returns a object representation of this object.
        This mechanism is used for dumping the object in JSON format.
        """

        # It seems that only one line is specified for each mapping. Tentatively
        # simplify the generated JSON given this axiom.
        assert len(self.lines) == 1

        return {
            'coverage': self.coverage,
            'line': self.lines[0].toJSON(),
            'statements': [s.toJSON() for s in self.statements],
            'decisions': [d.toJSON() for d in self.decisions],
            'message': self.message.toJSON() if self.message is not None else {}
        }


class Source(object):
    """Represents a message object as read in the XML file.
    Contains 2 mandatory attributes:
        - filename
        - coverage_level

    Also provides an additional list of mapping.
    """

    def __init__(self, filename, coverage_level):
        """Source Ctor."""
        self.filename = filename
        self.coverage_level = coverage_level
        self.mappings = []

    def toJSON(self):
        """Returns a object representation of this object.
        This mechanism is used for dumping the object in JSON format.
        """

        return {
            'filename': self.filename,
            'coverage_level': self.coverage_level,
            'mappings': [m.toJSON() for m in self.mappings]
        }


class XmlReportHandler(xml.sax.handler.ContentHandler):
    def __init__(self, report_dir):
        """XmlReportHandler Ctor."""

        self.report_dir = report_dir

        self.coverage_level = None
        self.traces = []
        self.sources = []

        self.tmp_source = None
        self.tmp_mapping = None
        self.tmp_statement = None
        self.tmp_decision = None
        self.tmp_condition = None

    def startElement(self, name, attributes):
        """Signals the start of an element in non-namespace mode."""

        if name == 'coverage_report':
            self.coverage_level = attributes['coverage_level']

        elif name == 'trace':
            self.traces.append(XmlReportHandler._createTrace(attributes))

        elif name == 'line':
            line = XmlReportHandler._createLine(attributes)

            if self.tmp_condition is not None:
                # Sanity checks
                assert self.tmp_statement is None
                assert self.tmp_decision is not None
                assert self.tmp_mapping is not None

                self.tmp_condition.lines.append(line)

            elif self.tmp_decision is not None:
                # Sanity checks
                assert self.tmp_statement is None
                assert self.tmp_mapping is not None
                self.tmp_decision.lines.append(line)

            elif self.tmp_statement is not None:
                # Sanity checks
                assert self.tmp_mapping is not None
                self.tmp_statement.lines.append(line)

            elif self.tmp_mapping is not None:
                self.tmp_mapping.lines.append(line)

            else:
                raise Exception('unexpected <line> tag')

        elif name == 'source':
            # Sanity checks
            assert self.tmp_source is None
            assert self.tmp_mapping is None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.tmp_source = Source(attributes['file'],
                                     attributes['coverage_level'])

        elif name == 'src_mapping':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.tmp_mapping = SourceMapping(attributes['coverage'])

        elif name == 'message':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            SCO = attributes['SCO'] if 'SCO' in attributes else None
            self.tmp_mapping.message = Message(attributes['kind'], SCO,
                                               attributes['message'])

        elif name == 'statement':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.tmp_statement = Statement(int(attributes['id']),
                                           attributes['text'],
                                           attributes['coverage'])

        elif name == 'decision':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.tmp_decision = Decision(int(attributes['id']),
                                         attributes['text'],
                                         attributes['coverage'])

        elif name == 'condition':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is not None
            assert self.tmp_condition is None

            self.tmp_condition = Condition(int(attributes['id']),
                                           attributes['text'],
                                           attributes['coverage'])

        elif name == 'xi:include':
            print >>sys.stderr, 'parsing %s' % attributes['href']
            parser = xml.sax.make_parser()
            parser.setContentHandler(self)
            parser.parse(os.path.join(self.report_dir, attributes['href']))


    def endElement(self, name):
        """Signals the end of an element in non-namespace mode."""

        if name == 'condition':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is not None
            assert self.tmp_condition is not None

            self.tmp_decision.conditions.append(self.tmp_condition)
            self.tmp_condition = None

        elif name == 'decision':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is not None
            assert self.tmp_condition is None

            self.tmp_mapping.decisions.append(self.tmp_decision)
            self.tmp_decision = None

        elif name == 'statement':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is not None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.tmp_mapping.statements.append(self.tmp_statement)
            self.tmp_statement = None

        elif name == 'src_mapping':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is not None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.tmp_source.mappings.append(self.tmp_mapping)
            self.tmp_mapping = None

        elif name == 'source':
            # Sanity checks
            assert self.tmp_source is not None
            assert self.tmp_mapping is None
            assert self.tmp_statement is None
            assert self.tmp_decision is None
            assert self.tmp_condition is None

            self.sources.append(self.tmp_source)
            self.tmp_source = None

    @staticmethod
    def _createTrace(attr):
        """Creates a trace object given the input attributes."""

        return Trace(attr['filename'], attr['program'], attr['date'],
                     attr['tag'])

    @staticmethod
    def _createLine(attr):
        """Creates a line object given the input attributes."""

        col_begin = int(attr['column_begin']) if 'column_begin' in attr else None
        col_end = int(attr['column_end']) if 'column_end' in attr else None
        exempted = attr['exempted'] == 'TRUE' if 'exempted' in attr else False
        src = attr['src'] if 'src' in attr else None

        return Line(int(attr['num']), src, exempted, col_begin, col_end)

    def __repr__(self):
        """Returns a JSON-serialized string representation of this object."""

        return json.dumps({
            'coverage_level': self.coverage_level,
            'traces': [t.toJSON() for t in self.traces],
            'sources': [s.toJSON() for s in self.sources]
        })


# Python main
if __name__ == '__main__':
    import sys

    if len(sys.argv) != 2:
        print >>sys.stderr, 'Error: Expected one and only one argument.'
        print >>sys.stderr, ('Usage: %s <report_directory>'
                             % os.path.basename(sys.argv[0]))
        sys.exit(1)

    report_dir = sys.argv[1]

    parser = xml.sax.make_parser()
    handler = XmlReportHandler(report_dir)
    parser.setContentHandler(handler)

    parser.parse(os.path.join(report_dir, 'index.xml'))
    print repr(handler)

    sys.exit(1)
