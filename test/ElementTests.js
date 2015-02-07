var fs = require('fs'),
    sax = require('sax'),
    Element = require('../lib/Element');

function loadXML(name) {
    // read file
    var xml = fs.readFileSync('./test/xml/' + name + '.xml').toString();

    // create praser
    var parser = sax.parser(true);

    parser.onopentag = function(node) {
        var element = new Element(node.name);

        Object.keys(node.attributes).forEach(function(name) {
            var value = node.attributes[name];

            element.setAttribute(name, value);
        });

        stack[stack.length - 1].addChild(element);
        stack.push(element);
    };

    parser.onclosetag = function() {
        stack.pop();
    };

    // setup document and element stack
    var root = new Element("#document");
    var stack = [root];

    // parse XML
    parser.write(xml).close();

    return root;
}

function layerComparator(a, b) {
    var aIsString = typeof a === "string";
    var bIsString = typeof b === "string";

    if (aIsString || bIsString) {
        return (aIsString === bIsString);
    }
    else if (a.elementName === b.elementName) {
        switch (a.elementName) {
            case "layer":
                return a.getAttribute("id") === b.getAttribute("id");

            default:
                return true;
        }
    }
    else {
        return false;
    }
}

function whenComparator(a, b) {
    var aIsString = typeof a === "string";
    var bIsString = typeof b === "string";

    if (aIsString || bIsString) {
        return (aIsString === bIsString);
    }
    else if (a.elementName === b.elementName) {
        switch (a.elementName) {
            case "when":
                return a.getAttribute("condition") === b.getAttribute("condition");

            default:
                return true;
        }
    }
    else {
        return false;
    }
}

function chooseComparator(a, b) {
    var aIsString = typeof a === "string";
    var bIsString = typeof b === "string";

    if (aIsString || bIsString) {
        return (aIsString === bIsString);
    }
    else if (a.elementName === b.elementName) {
        switch (a.elementName) {
            case "choose":
                var result = false;

                if (a.children.length === b.children.length) {
                    var comparator = arguments.callee;

                    result = a.children.every(function(aChild, idx) {
                        var bChild = b.children[idx];

                        return comparator(aChild, bChild);
                    });
                }

                return result;

            case "when":
                return a.getAttribute("condition") === b.getAttribute("condition");

            default:
                return true;
        }
    }
    else {
        return false;
    }
}

exports.rootMerge = function(beforeExit, assert) {
    var a = loadXML("root");
    var b = loadXML("root");
    var m = a.merge(b);

    assert.strictEqual(m.toString(), a.toString());
    assert.strictEqual(m.toString(), b.toString());
};

exports.firstHasAttribute = function(beforeExit, assert) {
    var a = loadXML("rootWithAttribute");
    var b = loadXML("root");
    var m = a.merge(b);

    assert.strictEqual(m.toString(), a.toString());
};

exports.secondHasAttribute = function(beforeExit, assert) {
    var a = loadXML("root");
    var b = loadXML("rootWithAttribute");
    var m = a.merge(b);

    assert.strictEqual(m.toString(), b.toString());
};

exports.bothHaveSameAttribute = function(beforeExit, assert) {
    var a = loadXML("rootWithAttribute");
    var b = loadXML("rootWithAttribute2");
    var m = a.merge(b);

    assert.strictEqual(m.toString(), b.toString());
};

exports.matchingLayerIds = function(beforeExit, assert) {
    var a = loadXML("mainLayer");
    var b = loadXML("mainLayer2");
    var m = a.merge(b, layerComparator);

    assert.strictEqual(m.toString(), b.toString());
};

exports.mismatchingWhenConditions = function(beforeExit, assert) {
    var a = loadXML("when");
    var b = loadXML("when2");
    var expected = loadXML("mergedWhens");
    var m = a.merge(b, whenComparator);

    assert.strictEqual(m.toString(), expected.toString());
};

exports.mismatchingChooseChildren = function(beforeExit, assert) {
    var a = loadXML("when");
    var b = loadXML("when2");
    var expected = loadXML("mergedChooses");
    var m = a.merge(b, chooseComparator);

    assert.strictEqual(m.toString(), expected.toString());
};

exports.matchingChooseChildren = function(beforeExit, assert) {
    var a = loadXML("choose");
    var b = loadXML("choose2");
    var expected = loadXML("mergedChooses2");
    var m = a.merge(b, chooseComparator);

    assert.strictEqual(m.toString(), expected.toString());
};

exports.firstHasMoreChildren = function(beforeExit, assert) {
    var a = loadXML("ThreeChildren");
    var b = loadXML("TwoChildren");
    var m = a.merge(b);

    assert.strictEqual(m.toString(), a.toString());
};

exports.firstHasLessChildren = function(beforeExit, assert) {
    var a = loadXML("TwoChildren");
    var b = loadXML("ThreeChildren");
    var m = a.merge(b);

    assert.strictEqual(m.toString(), b.toString());
};

exports.entitizeLessThan = function(beforeExit, assert) {
    var element = new Element("test");

    element.setAttribute("a", "<");

    assert.strictEqual(element.toString().trim(), '<test a="&lt;"/>');
};

exports.entitizeGreaterThan = function(beforeExit, assert) {
    var element = new Element("test");

    element.setAttribute("a", ">");

    assert.strictEqual(element.toString().trim(), '<test a="&gt;"/>');
};

exports.entitizeAmpersand = function(beforeExit, assert) {
    var element = new Element("test");

    element.setAttribute("a", "&");

    assert.strictEqual(element.toString().trim(), '<test a="&amp;"/>');
};

exports.entitizeQuote = function(beforeExit, assert) {
    var element = new Element("test");

    element.setAttribute("a", "\"");

    assert.strictEqual(element.toString().trim(), '<test a="&quot;"/>');
};

exports.entitizeApostrophe = function(beforeExit, assert) {
    var element = new Element("test");

    element.setAttribute("a", "'");

    assert.strictEqual(element.toString().trim(), '<test a="&apos;"/>');
};
