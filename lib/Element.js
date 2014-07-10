
var entities = {
    ">": "&gt;",
    "<": "&lt;",
    "&": "&amp;"
}
var entityPattern = /([<>&])/g;
var indentChars = "  ";

// Element class

function Element(name, attributes) {
    this.elementName = name;
    this.attributes = {};
    this.children = [];

    // apply attributes if any
    if (attributes !== undefined) {
        for (var p in attributes) this.setAttribute(p, attributes[p]);
    }
}

Element.prototype.getAttibuteNames = function() {
    return Object.keys(this.attributes);
};

Element.prototype.getAttribute = function(name) {
    return this.attributes[name];
};

Element.prototype.setAttribute = function(name, value) {
    if (value === undefined || value === null) {
        delete this.attributes[name];
    }
    else {
        this.attributes[name] = value;
    }
};

Element.prototype.setAttributeIfNotEqual = function(attr, value, defaultValue) {
    if (value !== defaultValue) {
        this.setAttribute(attr, value);
    }
};

Element.prototype.forEachAttribute = function(callback, thisArg) {
    Object.keys(this.attributes).forEach(function (name) {
        callback.call(thisArg, name, this.attributes[name]);
    }, this);
}

Element.prototype.addChildren = function(children) {
    this.children = this.children.concat(children);
};

Element.prototype.addChild = function(child) {
    if (child !== undefined && child !== null) {
        this.children.push(child);
    }
};

Element.prototype.addCData = function (text) {
    this.cdata = text;
}

Element.prototype.toString = function() {
    var buffer = [];

    printTree(this, buffer, 0);

    return buffer.join("");
};

Element.prototype.merge = function(node, comparator) {
    return merge(this, node, (comparator !== undefined) ? comparator : elementComparator);
}

// helper methods

function entitize(text) {
    return new String(text).replace(entityPattern, function(match, text) {
        return entities[text];
    });
}

function printTree(node, buffer, indent) {
    var indentText = new Array(indent + 1).join(indentChars);

    if (typeof node === "string") {
        buffer.push(indentText);
        buffer.push(entitize(node));
        buffer.push("\n");
    }
    else if (node.elementName === "#cdata-section") {
        buffer.push("<![CDATA[\n");
        node.children.forEach(function (child) {
            printTree(child, buffer, indent + 2);
        });
        buffer.push("\n");
        buffer.push(indentText);
        buffer.push("]]>\n");
    }
    else if (node.elementName === "#document" || node.elementName === "#document-fragment") {
        node.children.forEach(function (child) {
            printTree(child, buffer, indent);
        });
    }
    else {
        // open tag
        buffer.push(indentText);
        buffer.push("<");
        buffer.push(node.elementName);

        // write attributes
        Object.keys(node.attributes).forEach(function(attrName) {
            buffer.push(" ");
            buffer.push(attrName);
            buffer.push('="');
            buffer.push(entitize(node.getAttribute(attrName)));
            buffer.push('"');
        });

        // write children and close tag
        if (node.children.length > 0) {
            buffer.push(">\n");

            node.children.forEach(function (child) {
                printTree(child, buffer, indent + 2);
            });

            buffer.push(indentText);
            buffer.push("</");
            buffer.push(node.elementName);
            buffer.push(">\n");
        }
        else {
            buffer.push("/>\n");
        }
    }
}

function merge(a, b, comparator) {
    var result = null;

    if (comparator(a, b)) {
        result = new Element(a.elementName);

        // copy attributes
        a.forEachAttribute(function(name, value) {
            result.setAttribute(name, value);
        });
        b.forEachAttribute(function (name, value) {
            result.setAttribute(name, value);
        });

        // process children
        var aChildren = a.children;
        var bChildren = b.children;
        var aIndex = 0;
        var bIndex = 0;

        while (aIndex < aChildren.length && bIndex < bChildren.length) {
            var aChild = aChildren[aIndex];
            var bChild = bChildren[bIndex];

            if (comparator(aChild, bChild)) {
                result.addChild(merge(aChild, bChild, comparator));
                aIndex++;
                bIndex++;
            }
            else {
                importElements(aChild, result);
                aIndex++;
            }
        }

        while (aIndex < aChildren.length) {
            var child = aChildren[aIndex++];

            importElements(child, result);
        }

        while (bIndex < bChildren.length) {
            var child = bChildren[bIndex++];

            importElements(child, result);
        }
    }
    else {
        console.log("%s !== %s", a.elementName, b.elementName);
    }

    return result;
}

function elementComparator(a, b) {
    var aIsString = typeof a === "string";
    var bIsString = typeof b === "string";

    if (aIsString || bIsString) {
        return (aIsString === bIsString);
    }
    else {
        return (a.elementName === b.elementName);
    }
}

function importElements(source, destination) {
    if (typeof source === "string") {
        destination.addChild(source);
    }
    else {
        var element = new Element(source.elementName);

        source.forEachAttribute(function (name, value) {
            element.setAttribute(name, value);
        });

        destination.addChild(element);

        source.children.forEach(function (child) {
            importElements(child, element);
        });
    }
}

// export Element class

module.exports = Element;
