var paths = [];
var loops = [];
var mergedLoops = [];
var overAllGain = 0;
var overAllDelta = 0;

/**
 * Edge
 * @param from
 * @param to
 * @param gain
 */
function edge(from, to, gain) {
    this.from = from;
    this.to = to;
    this.gain = gain;
    this.id = 0;
}


/**
 * Main function
 * @param edgesList     edges list from view
 * @param numberOfNodes
 * @param source
 * @param sink
 */

function main(edgesList, numberOfNodes, source, sink) {
    var edgeList = edgesList;
    var adjList = fromEdgeListToAdjList(edgeList, numberOfNodes);
    var sourceNode = source;
    var sinkNode = sink;
    paths = [];
    loops = [];
    mergedLoops = [];
    var visited;

    // main algorithm
    getPaths(sourceNode, []);
    initializeVisited();
    getLoops(sourceNode, []);
    overAllGain = calculateOverAllGain();

    // Objects
    /**
     * Prototype of path
     * @param nodes
     * @param gain
     * @param edgeList
     */
    function path(nodes, gain, edgeList, edges) {
        this.nodes = nodes;
        this.gain = gain;
        this.edgeList = edgeList;
        this.edges = edges;
        this.delta;

        this.isTouch = function (anotherPath) {
            for (var i = 0; i < nodes.length; i++) {
                if (contains(anotherPath.nodes, nodes[i]))
                    return true;
            }
            return false;
        }

        this.clone = function () {
            return new path(this.nodes, this.gain, this.edgeList, this.edges);
        }
    }

    // Functions
    /**
     * Mapping edgeList
     * @param edgeList
     * @param numberOfNodes
     * @returns {Array|any[]}
     */
    function fromEdgeListToAdjList(edgeList, numberOfNodes) {
        adjList = new Array(numberOfNodes);
        visited = new Array(numberOfNodes);
        initializeVisited();
        for (var i = 0; i < numberOfNodes; i++) {
            adjList[i] = [];
        }
        for (var i = 0; i < edgeList.length; i++) {
            edgeList[i].id = i;
            adjList[edgeList[i].from].push(edgeList[i]);
        }
        return adjList;
    }

    /**
     * Get all forward paths
     * @param node
     * @param currentPath
     */
    function getPaths(node, currentPath) {
        visited[node] = true;
        if (node == sinkNode) {
            var path = copyArray(currentPath);
            paths.push(edgeListToPath(path));
        }
        for (var i = 0; i < adjList[node].length; i++) {
            var to = adjList[node][i].to;
            if (!visited[to]) {
                currentPath.push(adjList[node][i]);
                getPaths(to, currentPath);
                currentPath.pop();
            }
        }
        visited[node] = false;
    }

    /**
     * Get all forward loops
     * @param node
     * @param currentPath
     */
    function getLoops(node, currentPath) {
        for (var i = 0; i < numberOfNodes; i++) {
            initializeVisited();
            DFS(i, i, []);
        }

        function DFS(node, tempSink, currentPath) {
            visited[node] = true;
            for (var i = 0; i < adjList[node].length; i++) {
                var to = adjList[node][i].to;
                if (!visited[to]) {
                    currentPath.push(adjList[node][i]);
                    DFS(to, tempSink, currentPath);
                    currentPath.pop();
                } else if (to == tempSink) {
                    currentPath.push(adjList[node][i]);
                    var currentLoop = copyArray(currentPath);
                    var loop = edgeListToPath(currentLoop);
                    if (!multipleLoop(loops, loop))
                        loops.push(loop);
                    currentPath.pop();
                }
            }
            visited[node] = false;
        }
    }

    /**
     * Evaluate delta for path or gain
     * @param loopList
     * @param itr
     * @param loopGain
     * @returns {*}
     */
    function evaluateDelta(loopList, loopsSet, itr, loopGain) {
        if (loopList.length == 0) {
            return loopGain;
        }
        var newLoopList = [];
        for (var i = 0; i < loopList.length; i++) {
            for (var j = 0; j < loopsSet.length; j++) {
                if (!loopList[i].isTouch(loopsSet[j])) {
                    var mergedLoop = mergeTwoLoops(loopList[i], loopsSet[j]);
                    if (multipleLoop(mergedLoops, mergedLoop))
                        continue;
                    newLoopList.push(mergedLoop);
                    loopGain += ((itr % 2 == 0) ? 1 : -1) * mergedLoop.gain;
                    mergedLoops.push(mergedLoop);
                }
            }
        }
        return evaluateDelta(newLoopList, loopsSet, itr + 1, loopGain);
    }

    /**
     * Get numeric value of delta
     * @param loopsList
     * @returns {*}
     */
    function getDelta(loopsList) {
        return 1 - allLoopsGain(loopsList) + evaluateDelta(loopsList, loopsList, 0, 0);
    }

    /**
     * Map edge list to path
     * @param edgeList
     * @returns {path}
     */
    function edgeListToPath(edgeList) {
        var nodeSet = new Set();
        var pathGain = 1;
        var edges = [];
        for (var i = 0; i < edgeList.length; i++) {
            nodeSet.add(edgeList[i].from);
            nodeSet.add(edgeList[i].to);
            pathGain *= edgeList[i].gain;
            edges.push(edgeList[i].id);
        }
        var nodes = [];
        nodeSet.forEach(function (item) {
            nodes.push(item);
        });
        nodes.sort();
        edges.sort();
        return new path(nodes, pathGain, copyArray(edgeList), edges);
    }

    /**
     * Merge two non touched Loops
     * @param firstLoop
     * @param secondLoop
     * @returns {path}
     */
    function mergeTwoLoops(firstLoop, secondLoop) {
        var nodeSet = new Set(firstLoop.nodes);
        var edges = [];
        secondLoop.nodes.forEach(function (item) {
            nodeSet.add(item);
        });
        var pathGain = firstLoop.gain * secondLoop.gain;
        var edgeList = [];
        firstLoop.edgeList.forEach(function (item) {
            var e = new edge(item.from, item.to, item.gain);
            e.id = item.id;
            edgeList.push(e);
            edges.push(item.id);
        });
        secondLoop.edgeList.forEach(function (item) {
            var e = new edge(item.from, item.to, item.gain);
            e.id = item.id;
            edgeList.push(e);
            edges.push(item.id);
        });
        var nodes = [];
        nodeSet.forEach(function (item) {
            nodes.push(item);
        });
        nodes.sort();
        edges.sort();
        return new path(nodes, pathGain, copyArray(edgeList), edges);
    }

    /**
     * Set Deltas
     */
    function calculatePathsDelta() {
        for (var i = 0; i < paths.length; i++) {
            var nonTouchedLoops = [];
            mergedLoops = [];
            for (var j = 0; j < loops.length; j++) {
                if (!paths[i].isTouch(loops[j]))
                    nonTouchedLoops.push(loops[j]);
            }
            paths[i].delta = getDelta(nonTouchedLoops);
        }
    }

    /**
     *
     * @returns {number}    Over all gain of SFG
     */
    function calculateOverAllGain() {
        calculatePathsDelta();
        var overAllGain = 0;
        paths.forEach(function (item) {
            overAllGain += (item.gain * item.delta);
        });
        mergedLoops = [];
        overAllDelta = getDelta(copyArray(loops));
        overAllGain /= overAllDelta;
        return overAllGain;
    }

    // Helpful functions
    /**
     * Check if a loop is multiple or not
     * @param loop
     * @returns {boolean}
     */
    function multipleLoop(loopSet, loop) {
        var ret = false;
        loopSet.forEach(function (item) {
            ret |= checkDuplicated(item, loop);
        });
        return ret;

        function checkDuplicated(firstLoop, secondLoop) {
            if (firstLoop.nodes.length != secondLoop.nodes.length)
                return false;
            if (firstLoop.edgeList.length != secondLoop.edgeList.length)
                return false;
            var counter = 0;
            for (var i = 0; i < firstLoop.edges.length; i++) {
                if (firstLoop.edges[i] == secondLoop.edges[i])
                    counter++;
            }
            if (counter == firstLoop.edges.length)
                return true;
            else
                return false;
        }

        function sameEdge(edge1, edge2) {
            return edge1.id == edge2.id;
        }
    }

    /**
     * Calculate sum of loopsList's gain
     * @param loopsList
     * @returns {number}
     */
    function allLoopsGain(loopsList) {
        var loopsGain = 0;
        loopsList.forEach(function (item) {
            loopsGain += item.gain;
        });
        return loopsGain;
    }


    function initializeVisited() {
        for (var i = 0; i < visited.length; i++) {
            visited[i] = false;
        }
    }

    /**
     * check if an array contains element or not
     * @param array
     * @param value
     * @returns {boolean}
     */
    function contains(array, value) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == value)
                return true;
        }
        return false;
    }
}

/**
 * Array deep copy
 * @param firstArray
 * @returns {any[]}
 */
function copyArray(firstArray) {
    var secondArray = new Array(firstArray.length)
    for (var i = 0; i < firstArray.length; i++)
        secondArray[i] = firstArray[i];
    return secondArray;
}


/**
 *  ex : [new edge(from, to, gain), new edge(1, 2, 20), new edge(2, 3, 30)]
 * @returns {Array}     return Forward paths as edge List
 */
function getForwardPaths() {
    var forwardPaths = [];
    paths.forEach(function (item) {
        forwardPaths.push(copyArray(item.edgeList));
    });
    return forwardPaths;
}

/**
 *  ex : [new edge(from, to, gain), new edge(1, 2, 20), new edge(2, 3, 30)]
 * @returns {Array}     return loops as edge list
 */
function getLoops() {
    var finalLoops = [];
    loops.forEach(function (item) {
        finalLoops.push(copyArray(item.edgeList));
    });
    return finalLoops;
}

/**
 * Get all combination of non touched loops
 * @returns {Array}
 */
function getMergedLoops() {
    var loops = [];
    mergedLoops.forEach(function (item) {
        loops.push(copyArray(item.edgeList));
    });
    return loops;
}

/**
 * return paths' deltas
 * @returns {Array}
 */
function getDeltas() {
    var deltas = [];
    paths.forEach(function (item) {
        deltas.push(item.delta);
    });
    return deltas;
}

// How to call main function
var edgeList = [new edge(0, 1, 10), new edge(1, 2, 20), new edge(2, 3, 30), new edge(1, 0, -10),
    new edge(1, 4, 10), new edge(3, 0, -10), new edge(3, 2, -1), new edge(3, 4, 10),
    new edge(4, 5, 10), new edge(5, 4, -1)];
main(edgeList, 6, 0, 5);

console.log(overAllGain);
console.log("Paths");
console.log(getForwardPaths());
console.log("Loops");
console.log(getLoops());
console.log("MergedLoops");
console.log(getMergedLoops());
console.log(getDeltas());
