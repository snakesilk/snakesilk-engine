'use strict';

Engine.XMLNodeList =
class XMLNodeList extends Array
{
    static fetch(url) {
        return fetch(url)
            .then(response => response.text())
            .then(text => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/xml');
                doc.baseURL = url;
                return Engine.XMLNodeList.from(doc.children);
            });
    }

    static from(nodes) {
        const xmlNodes = [...nodes].map(node => new Engine.XMLNode(node));
        const xmlNodeList = new Engine.XMLNodeList();
        xmlNodeList.push(...xmlNodes);
        return xmlNodeList;
    }

    static merge(...nodeLists) {
        return nodeLists.reduce((mergedList, nodeList) => {
            const exp = [...nodeList];
            mergedList.push(...exp);
            return mergedList;
        }, new Engine.XMLNodeList());
    }

    attr(name) {
        return this.reduce((attributes, node) => {
            const attr = node.attr(name);
            attributes.push(attr);
            console.log(attributes);
            return attributes;
        }, [])
    }

    find(selector)
    {
        const tasks = this.map(node => node.find(selector));
        return Promise.all(tasks)
            .then(nodeLists => {
                return Engine.XMLNodeList.merge(...nodeLists);
            });
    }
}

Engine.XMLNode =
class XMLNode {
    constructor(node) {
        if (!node.tagName) {
            throw new TypeError('Not a node');
        }

        this.node = node;
    }

    attr(name) {
        const value = this.node.getAttribute(name);
        if (value != null) {
            return new Engine.XMLAttr(name, value, this.node);
        } else {
            return null;
        }
    }

    find(selector) {
        const children = this.node.querySelectorAll(selector);
        const nodeList = Engine.XMLNodeList.from(children);
        const tasks = nodeList.map(node => {
            const src = node.attr('src');
            if (src) {
                return Engine.XMLNodeList.fetch(src.toURL())
                    .then(nodeList => {
                        return nodeList[0];
                    });
            }
            return node;
        });
        return Promise.all(tasks)
            .then(nodes => nodes.map(node => node.node))
            .then(rawNodes => Engine.XMLNodeList.from(rawNodes));
    }

    text() {
        this.node.textContent;
    }
}

Engine.XMLAttr =
class XMLAttribute {
    constructor(name, value, ownerNode = null) {
        this.name = name;
        this.value = value;
        this.node = ownerNode;
    }

    toBool() {
        return this.value === 'true';
    }

    toFloat() {
        return parseFloat(this.value);
    }

    toInt() {
        return parseFloat(this.value, 10);
    }

    toURL() {
        const url = this.value;
        if (url.indexOf('http') === 0) {
            return url;
        }
        if (this.node.ownerDocument.baseURL === undefined) {
            return url;
        }
        const baseUrl = this.node.ownerDocument.baseURL
            .split('/').slice(0, -1).join('/') + '/';

        return baseUrl + url;
    }

    __toString() {
        return this.value;
    }
}
