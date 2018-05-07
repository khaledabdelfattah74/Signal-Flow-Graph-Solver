var inputNode = 0;
var outputNode = 0;
var $ = go.GraphObject.make; // for conciseness in defining templates
var indexToNodeData = {};
var mainDiagram;
var mainNodeData;
function init() {
    myDiagram =
        $(go.Diagram, "DiagramDiv", // must name or refer to the DIV HTML element
            {
                // start everything in the middle of the viewport
                initialContentAlignment: go.Spot.Center,
                // have mouse wheel events zoom in and out instead of scroll up and down
                "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
                // support double-click in background creating a new node
                "clickCreatingTool.archetypeNodeData": {
                    text: "New Node"
                },
                // enable undo & redo
                "undoManager.isEnabled": true
            });
    // define the Node template
    myDiagram.nodeTemplate =
        $(go.Node, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // define the node's outer shape, which will surround the TextBlock
            $(go.Shape, "RoundedRectangle", {
                parameter1: 20, // the corner has a large radius
                fill: $(go.Brush, "Linear", {
                    0: "rgb(254, 201, 0)",
                    1: "rgb(254, 162, 0)"
                }),
                stroke: null,
                portId: "", // this Shape is the Node's port, not the whole Node
                fromLinkable: true,
                fromLinkableSelfNode: true,
                fromLinkableDuplicates: true,
                toLinkable: true,
                toLinkableSelfNode: true,
                toLinkableDuplicates: true,
                cursor: "pointer"
            }),
            $(go.TextBlock, {
                    font: "bold 11pt helvetica, bold arial, sans-serif",
                    editable: true // editing the text automatically updates the model data
                },
                new go.Binding("text").makeTwoWay())
        );

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
        $(go.Link, // the whole link panel
            {
                curve: go.Link.Bezier,
                adjusting: go.Link.Stretch,
                reshapable: true,
                relinkableFrom: true,
                relinkableTo: true,
                toShortLength: 3
            },
            new go.Binding("points").makeTwoWay(),
            new go.Binding("curviness"),
            $(go.Shape, // the link shape
                {
                    strokeWidth: 1.5
                }),
            $(go.Shape, // the arrowhead
                {
                    toArrow: "standard",
                    stroke: null
                }),
            $(go.Panel, "Auto",
                $(go.Shape, // the label background, which becomes transparent around the edges
                    {
                        fill: $(go.Brush, "Radial", {
                            0: "rgb(240, 240, 240)",
                            0.3: "rgb(240, 240, 240)",
                            1: "rgba(240, 240, 240, 0)"
                        }),
                        stroke: null
                    }),
                $(go.TextBlock, "transition", // the label text
                    {
                        textAlign: "center",
                        font: "9pt helvetica, arial, sans-serif",
                        margin: 4,
                        editable: true // enable in-place editing
                    },
                    // editing the text automatically updates the model data
                    new go.Binding("text").makeTwoWay())
            )
        );
    // unlike the normal selection Adornment, this one includes a Button
    myDiagram.nodeTemplate.selectionAdornmentTemplate =
        $(go.Adornment, "Spot",
            $(go.Panel, "Auto",
                $(go.Shape, {
                    fill: null,
                    stroke: "blue",
                    strokeWidth: 2
                }),
                $(go.Placeholder) // a Placeholder sizes itself to the selected Node
            ),
            // the button to create a "next" node, at the top-right corner
            $("Button", {
                    alignment: go.Spot.TopLeft,
                    click: setInputNode // this function is defined below
                },
                $(go.TextBlock, "I/P")
            ),
            $("Button", {
                    alignment: go.Spot.BottomRight,
                    click: setOutputNode // this function is defined below
                },
                $(go.TextBlock, "O/P")
            )
        ); // end Adornment
    return myDiagram;
}

function setInputNode(e, obj) {
    if (mainDiagram.selection.count != 1) {
        alert("Please Select only one node")
    } else {
        mainDiagram.selection.each(function(n) {
            if (!n instanceof go.Node) return;
            inputNode = n.data.key;
            document.getElementById("InputNodeText").innerHTML = n.data.text;
        })
    }
}

function setOutputNode(e, obj) {
    if (mainDiagram.selection.count != 1) {
        alert("Please Select only one node")
    } else {
        mainDiagram.selection.each(function(n) {
            if (!n instanceof go.Node) return;
            outputNode = n.data.key;
            document.getElementById("OutputNodeText").innerHTML = n.data.text;
        })
    }
}

function compute() {
    if (inputNode == 0)
        alert("Please Select Input Node First")
    else if (outputNode == 0)
        alert("Please Select Output Node First")
    else {
        mainNodeData = Object.assign({},mainDiagram.model.nodeDataArray);
        var x;
        for (x in mainNodeData){
        	indexToNodeData[mainNodeData[x].key] = mainNodeData[x];
        }
        var edgesArr = [];
        mainDiagram.model.linkDataArray.forEach(function f(e) {
            edgesArr.push(toNormalEdge(e));
        })
        main(edgesArr,mainDiagram.model.nodeDataArray.length,toNormalIndex(inputNode),toNormalIndex(outputNode));
        var forwardPaths = getForwardPaths();
        var resultHTML = "<h3>Gain = " + overAllGain + "</h3>";
        resultHTML += "<h2>Forward Paths</h2>";
        for (var i = 0; i < forwardPaths.length; i++) {
            var pathGain = 1;
            for (var j = 0; j < forwardPaths[i].length; j++) {
                pathGain *= forwardPaths[i][j].gain;
            }
            resultHTML += "<h3>Path " + (i+1) + "  ->  Gain = " + pathGain + "</h3>";
            resultHTML += '<div id="PathDiagramDiv'+ i + '" style="margin: auto; width:400px; height:200px; background-color: #DAE4E4;"></div></br>';
        }
        resultHTML += "<h2>Loops</h2>";
        var loops = getLoops();
        for (var i = 0; i < loops.length; i++) {
            var loopGain = 1;
            for (var j = 0; j < loops[i].length; j++) {
                loopGain *= loops[i][j].gain;
            }
            resultHTML += "<h3>Loop " + (i+1) + "  ->  Gain = " + loopGain + "</h3>";
            resultHTML += '<div id="LoopDiagramDiv'+ i + '" style="margin: auto; width:400px; height:200px; background-color: #DAE4E4;"></div></br>';
        }
        document.getElementById("ResultDiv").innerHTML = resultHTML;
        for (var i = 0; i < forwardPaths.length; i++) {
            createDiagram("PathDiagramDiv"+i,forwardPaths[i]);
        }
        for (var i = 0; i < loops.length; i++) {
            createDiagram("LoopDiagramDiv"+i,loops[i]);
        }
    }
}
function toNormalIndex(x) {
    return (x*-1)-1;
}
function toNormalEdge(x) {
    return new edge(toNormalIndex(x.from),toNormalIndex(x.to),x.text);
}
function toGoIndex(x) {
    return (x*-1)-1;
}
function createDiagram(divID,edges) {
	myDiagram =
        $(go.Diagram, divID, // must name or refer to the DIV HTML element
            {
                // start everything in the middle of the viewport
                initialContentAlignment: go.Spot.Center,
                // have mouse wheel events zoom in and out instead of scroll up and down
                "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            });
    // define the Node template
    myDiagram.nodeTemplate =
        $(go.Node, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // define the node's outer shape, which will surround the TextBlock
            $(go.Shape, "RoundedRectangle", {
                parameter1: 20, // the corner has a large radius
                fill: $(go.Brush, "Linear", {
                    0: "rgb(254, 201, 0)",
                    1: "rgb(254, 162, 0)"
                }),
                stroke: null,
                portId: "", // this Shape is the Node's port, not the whole Node
                fromLinkable: true,
                fromLinkableSelfNode: true,
                fromLinkableDuplicates: true,
                toLinkable: true,
                toLinkableSelfNode: true,
                toLinkableDuplicates: true,
                cursor: "pointer"
            }),
            $(go.TextBlock, {
                    font: "bold 11pt helvetica, bold arial, sans-serif",
                    editable: true // editing the text automatically updates the model data
                },
                new go.Binding("text").makeTwoWay())
        );

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
        $(go.Link, // the whole link panel
            {
                curve: go.Link.Bezier,
                adjusting: go.Link.Stretch,
                reshapable: true,
                relinkableFrom: true,
                relinkableTo: true,
                toShortLength: 3
            },
            new go.Binding("points").makeTwoWay(),
            new go.Binding("curviness"),
            $(go.Shape, // the link shape
                {
                    strokeWidth: 1.5
                }),
            $(go.Shape, // the arrowhead
                {
                    toArrow: "standard",
                    stroke: null
                }),
            $(go.Panel, "Auto",
                $(go.Shape, // the label background, which becomes transparent around the edges
                    {
                        fill: $(go.Brush, "Radial", {
                            0: "rgb(240, 240, 240)",
                            0.3: "rgb(240, 240, 240)",
                            1: "rgba(240, 240, 240, 0)"
                        }),
                        stroke: null
                    }),
                $(go.TextBlock, "transition", // the label text
                    {
                        textAlign: "center",
                        font: "9pt helvetica, arial, sans-serif",
                        margin: 4,
                        editable: true // enable in-place editing
                    },
                    // editing the text automatically updates the model data
                    new go.Binding("text").makeTwoWay())
            )
        );
        var nodesKeys = new Set();
        for (var i = edges.length - 1; i >= 0; i--) {
        	nodesKeys.add(toGoIndex(edges[i].to));
        	nodesKeys.add(toGoIndex(edges[i].from));
        }
        function addSetNode(value1, value2, set) {
        	myDiagram.model.addNodeData(indexToNodeData[value1]);
		}
        nodesKeys.forEach(addSetNode);
        for (var i = edges.length - 1; i >= 0; i--) {
        	myDiagram.model.addLinkData({
                to : toGoIndex(edges[i].to),
                from : toGoIndex(edges[i].from),
                text : edges[i].gain
            });
        }
}