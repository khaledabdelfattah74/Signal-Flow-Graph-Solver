var paths = [];
var loops = [];
var mergedLoops = [];
var overAllGain = 0;

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
    function path(nodes, gain, edgeList) {
        this.nodes = nodes;
        this.gain = gain;
        this.edgeList = edgeList;
        this.delta;

        this.isTouch = function (anotherPath) {
            for (var i = 0; i < nodes.length; i++) {
                if (contains(anotherPath.nodes, nodes[i]))
                    return true;
            }
            return false;
        }

        this.clone = function () {
            return new path(this.nodes, this.gain, this.edgeList);
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
    function evaluateDelta(loopList, itr, loopGain) {
        if (loopList.length == 0) {
            return loopGain;
        }
        var newLoopList = [];
        for (var i = 0; i < loopList.length; i++) {
            for (var j = 0; j < loops.length; j++) {
                if (!loopList[i].isTouch(loops[j])) {
                    var mergedLoop = mergeTwoLoops(loopList[i], loops[j]);
                    if (multipleLoop(mergedLoops, mergedLoop))
                        continue;
                    newLoopList.push(mergedLoop);
                    loopGain += ((itr % 2 == 0) ? 1 : -1) * mergedLoop.gain;
                    mergedLoops.push(mergedLoop);
                }
            }
        }
        return evaluateDelta(newLoopList, itr + 1, loopGain);
    }

    /**
     * Get numeric value of delta
     * @param loopsList
     * @returns {*}
     */
    function getDelta(loopsList) {
        return 1 - allLoopsGain(loopsList) + evaluateDelta(loopsList, 0, 0);
    }

    /**
     * Map edge list to path
     * @param edgeList
     * @returns {path}
     */
    function edgeListToPath(edgeList) {
        var nodeSet = new Set();
        var pathGain = 1;
        for (var i = 0; i < edgeList.length; i++) {
            nodeSet.add(edgeList[i].from);
            nodeSet.add(edgeList[i].to);
            pathGain *= edgeList[i].gain;
        }
        var nodes = [];
        nodeSet.forEach(function (item) {
            nodes.push(item);
        });
        nodes.sort();
        return new path(nodes, pathGain, copyArray(edgeList));
    }

    /**
     * Merge two non touched Loops
     * @param firstLoop
     * @param secondLoop
     * @returns {path}
     */
    function mergeTwoLoops(firstLoop, secondLoop) {
        var nodeSet = new Set(firstLoop.nodes);
        secondLoop.nodes.forEach(function (item) {
            nodeSet.add(item);
        });
        var pathGain = firstLoop.gain * secondLoop.gain;
        var edgeList = [];
        firstLoop.edgeList.forEach(function (item) {
            edgeList.push(new edge(item.from, item.to, item.gain));
        });
        secondLoop.edgeList.forEach(function (item) {
            edgeList.push(new edge(item.from, item.to, item.gain));
        });
        var nodes = [];
        nodeSet.forEach(function (item) {
            nodes.push(item);
        });
        nodes.sort();
        return new path(nodes, pathGain, edgeList);
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
        overAllGain /= getDelta(copyArray(loops));
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
            var counter = 0;
            if (firstLoop.nodes.length != secondLoop.nodes.length)
                return false;
            if (firstLoop.edgeList.length != secondLoop.edgeList.length)
                return false;
            firstLoop.edgeList.forEach(function (item) {
                secondLoop.edgeList.forEach(function (itr) {
                    if (sameEdge(item, itr))
                        counter++;
                });
            });
            if (counter == firstLoop.edgeList.length)
                return true;
            else
                return false;
        }

        function sameEdge(edge1, edge2) {
            return (edge1.from == edge2.from && edge1.to == edge2.to && edge1.gain == edge2.gain);
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
