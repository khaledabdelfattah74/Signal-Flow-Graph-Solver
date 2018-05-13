var inputNode = 0;
var outputNode = 0;
var make = go.GraphObject.make; // for conciseness in defining templates
var indexToNodeData = {};
var mainDiagram;
var mainNodeData;
var resultDiagrams = [];
var computed = false;
function init() {
    $('#carouselExampleIndicators').on('slide.bs.carousel', function () {
        for (var i = 0; i < resultDiagrams.length; i++) {
            resultDiagrams[i].requestUpdate();
        }
    })
    myDiagram =
        make(go.Diagram, "DiagramDiv", // must name or refer to the DIV HTML element
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
        make(go.Node, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // define the node's outer shape, which will surround the TextBlock
            make(go.Shape, "RoundedRectangle", {
                parameter1: 20, // the corner has a large radius
                fill: "blue",
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
            make(go.TextBlock, {
                    font: "bold 11pt helvetica, bold arial, sans-serif",
                    stroke: "white",
                    editable: true // editing the text automatically updates the model data
                },
                new go.Binding("text").makeTwoWay())
        );

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
        make(go.Link, // the whole link panel
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
            make(go.Shape, // the link shape
                {
                    strokeWidth: 1.5
                }),
            make(go.Shape, // the arrowhead
                {
                    toArrow: "standard",
                    stroke: null
                }),
            make(go.Panel, "Auto",
                make(go.Shape, // the label background, which becomes transparent around the edges
                    {
                        fill: make(go.Brush, "Radial", {
                            0: "rgb(240, 240, 240)",
                            0.3: "rgb(240, 240, 240)",
                            1: "rgba(240, 240, 240, 0)"
                        }),
                        stroke: null
                    }),
                make(go.TextBlock, "transition", // the label text
                    {
                        textAlign: "center",
                        font: "11pt helvetica, arial, sans-serif",
                        stroke: "blue",
                        margin: 4,
                        editable: true // enable in-place editing
                    },
                    // editing the text automatically updates the model data
                    new go.Binding("text").makeTwoWay())
            )
        );
    // unlike the normal selection Adornment, this one includes a Button
    myDiagram.nodeTemplate.selectionAdornmentTemplate =
        make(go.Adornment, "Spot",
            make(go.Panel, "Auto",
                make(go.Shape, {
                    fill: null,
                    stroke: "blue",
                    strokeWidth: 2
                }),
                make(go.Placeholder) // a Placeholder sizes itself to the selected Node
            ),
            // the button to create a "next" node, at the top-right corner
            make("Button", {
                    alignment: go.Spot.TopLeft,
                    click: setInputNode // this function is defined below
                },
                make(go.TextBlock, "I/P")
            ),
            make("Button", {
                    alignment: go.Spot.BottomRight,
                    click: setOutputNode // this function is defined below
                },
                make(go.TextBlock, "O/P")
            )
        ); // end Adornment
    myDiagram.model = go.Model.fromJSON('{ "class": "go.GraphLinksModel",  "nodeDataArray": [ {"text":"0", "key":-1, "loc":"175.35 194.25"},{"text":"1", "key":-2, "loc":"338.1 240.45000000000005"},{"text":"2", "key":-3, "loc":"505.0500000000002 237.30000000000007"},{"text":"3", "key":-4, "loc":"730.8000000000001 113.39999999999998"},{"text":"4", "key":-5, "loc":"935.7693545553944 94.38280973935328"},{"text":"5", "key":-6, "loc":"1138.6749105282313 119.45227263034585"} ],  "linkDataArray": [ {"from":-1, "to":-2, "points":[206.5921943716685,213.18695635537955,254.33643749981795,212.08776004746446,298.2633199596816,224.37107388868,338.38731012592183,249.9934802208873], "text":"10"},{"from":-2, "to":-3, "points":[369.3331390075976,256.8676050922155,414.80719110389845,247.11016509908117,458.47703025397897,246.26920213274977,505.05575288836116,254.39192486652001], "text":"20"},{"from":-3, "to":-4, "points":[535.6567514910626,245.59715784663607,594.5119811440031,199.61427424398002,659.5373023826576,163.9097103878011,730.8305996351982,138.60184991603424], "text":"30"},{"from":-2, "to":-1, "points":[338.16767835320235,250.89425834865224,294.2113695387736,225.82641658985165,233.7655353306874,347.06608845686947,197.07204155701106,232.94362237211226], "text":"-10"},{"from":-2, "to":-4, "points":[369.300552258281,253.11321050709614,483.70139083749604,203.73352636620194,602.9641389081802,165.0066159224849,730.8118140276536,136.3361745594171], "text":"10"},{"from":-4, "to":-1, "points":[730.8112839523056,136.25513699420637,554.5857751271561,174.66876323133025,380.82589437516407,199.8206274331112,206.59103498155866,212.5339606320033], "text":"-10"},{"from":-4, "to":-3, "points":[736.9004867438414,150.7967252389112,699.3,221.55,615.3,273,536.28531191583,259.4575203376119], "text":"-1"},{"from":-4, "to":-5, "points":[762.0365129248698,135.31938890134487,852.0052793306681,147.77191650950252,864.3962433070183,130.05502973757126,935.7796193664302,117.07715563852506], "text":"10"},{"from":-5, "to":-6, "points":[967.0097510654854,112.4277223514022,1026.1935341551632,106.98462632267241,1083.4170689878822,114.0547298301994,1138.703129427041,133.4604319208306], "text":"10"},{"from":-6, "to":-5, "points":[1143.3496632941112,155.79975889815955,1084.3784229689832,246.66118634058418,1025.4279507617998,214.08329380503537,963.3161899747204,130.00702350599497], "text":"-1"} ]}');
    return myDiagram;
}

function setInputNode(e, obj) {
    if (mainDiagram.selection.count != 1) {
        displayErrorMessage("Please Select only one node")
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
        displayErrorMessage("Please Select only one node")
    } else {
        mainDiagram.selection.each(function(n) {
            if (!n instanceof go.Node) return;
            outputNode = n.data.key;
            document.getElementById("OutputNodeText").innerHTML = n.data.text;
        })
    }
}
function displayErrorMessage(errorMessage){
    document.getElementById('errorModalMessage').innerText = errorMessage;
    $('#errorModal').modal('show')
}
function compute() {
    if(computed){
        document.getElementById("resultModalCarouselIndicators").innerHTML = "";
        document.getElementById("resultModalCarouselInner").innerHTML = "";
        for (var i = 0; i < resultDiagrams.length; i++) {
            resultDiagrams[i].div = null;
        }
    }
    if (inputNode == 0) {
        displayErrorMessage("Please Select Input Node First");
    }
    else if (outputNode == 0)
        displayErrorMessage("Please Select Output Node First")
    else {
        computed = true;
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
        var forwardPathsDelta = getDeltas();
        tabNum = 0;
        for (var i = 0; i < forwardPaths.length; i++) {
            var pathGain = 1;
            for (var j = 0; j < forwardPaths[i].length; j++) {
                pathGain *= forwardPaths[i][j].gain;
            }
            infoElement = document.createElement('div');
            diagramTitle = document.createElement('h5');
            diagramTitle.innerText = "Forward Path " + (i+1);
            diagramInfo1 = document.createElement('p');
            diagramInfo1.innerText = "Gain  = " + pathGain;
            diagramInfo2 = document.createElement('p');
            diagramInfo2.innerText = "Delta = " + forwardPathsDelta[i];;
            infoElement.appendChild(diagramTitle);
            infoElement.appendChild(diagramInfo1);
            infoElement.appendChild(diagramInfo2);
            createResultsDiagram("PathDiagramDiv" + i, tabNum, forwardPaths[i], infoElement);
            tabNum++;
        }

        var loops = getLoops();
        for (var i = 0; i < loops.length; i++) {
            var loopGain = 1;
            for (var j = 0; j < loops[i].length; j++) {
                loopGain *= loops[i][j].gain;
            }
            infoElement = document.createElement('div');
            diagramTitle = document.createElement('h5');
            diagramTitle.innerText = "Loop " + (i+1);
            diagramInfo = document.createElement('p');
            diagramInfo.innerText = "Gain = " + loopGain;
            infoElement.appendChild(diagramTitle);
            infoElement.appendChild(diagramInfo);
            createResultsDiagram("LoopDiagramDiv" + i, tabNum, loops[i], infoElement);
            tabNum++;
        }

        var mergedLoops = getMergedLoops();
        for (var i = 0; i < mergedLoops.length; i++) {
            var mergedLoopGain = 1;
            for (var j = 0; j < mergedLoops[i].length; j++) {
                mergedLoopGain *= mergedLoops[i][j].gain;
            }
            infoElement = document.createElement('div');
            diagramTitle = document.createElement('h5');
            diagramTitle.innerText = "Merged Loop " + (i+1);
            diagramInfo = document.createElement('p');
            diagramInfo.innerText = "Gain = " + mergedLoopGain;
            infoElement.appendChild(diagramTitle);
            infoElement.appendChild(diagramInfo);
            createResultsDiagram("MergedLoopDiagramDiv" + i, tabNum, mergedLoops[i], infoElement);
            tabNum++;
        }

        //document.getElementById("resultModalContent").innerHTML = resultHTML;
        document.getElementById("exampleModalLabel").innerText = "Total Gain = "+ overAllGain;
        $('#resultModal').modal('show');
    }
}
function createResultsDiagram(divID,tabNum,graphEdges,infoElement) {
    tabsIndicators = document.getElementById("resultModalCarouselIndicators");
    tabIndicator = document.createElement('li');
    tabIndicator.setAttribute("data-target","#carouselExampleIndicators");
    tabIndicator.setAttribute("data-slide-to",tabNum);
    if(tabNum == 0)
        tabIndicator.setAttribute("class","active");
    tabsIndicators.appendChild(tabIndicator);

    resultTabsDivs = document.getElementById("resultModalCarouselInner");
    tabDiv = document.createElement('div');
    tabDiv.appendChild(infoElement);
    if(tabNum == 0)
        tabDiv.setAttribute("class","carousel-item active");
    else
        tabDiv.setAttribute("class","carousel-item");
    diagramDiv = document.createElement('div');
    diagramDiv.setAttribute("id",divID);
    diagramDiv
    diagramDiv.setAttribute("style","height: 400px; background-color:#ECF0F1;");
    tabDiv.appendChild(diagramDiv);
    resultTabsDivs.appendChild(tabDiv);
    resultDiagrams.push(createDiagram(divID,graphEdges));
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
        make(go.Diagram, divID, // must name or refer to the DIV HTML element
            {
                // start everything in the middle of the viewport
                initialContentAlignment: go.Spot.Center,
                // have mouse wheel events zoom in and out instead of scroll up and down
                "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            });
    // define the Node template
    myDiagram.nodeTemplate =
        make(go.Node, "Auto",
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
            // define the node's outer shape, which will surround the TextBlock
            make(go.Shape, "RoundedRectangle", {
                parameter1: 20, // the corner has a large radius
                fill: make(go.Brush, "Linear", {
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
            make(go.TextBlock, {
                    font: "bold 11pt helvetica, bold arial, sans-serif",
                    editable: true // editing the text automatically updates the model data
                },
                new go.Binding("text").makeTwoWay())
        );

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
        make(go.Link, // the whole link panel
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
            make(go.Shape, // the link shape
                {
                    strokeWidth: 1.5
                }),
            make(go.Shape, // the arrowhead
                {
                    toArrow: "standard",
                    stroke: null
                }),
            make(go.Panel, "Auto",
                make(go.Shape, // the label background, which becomes transparent around the edges
                    {
                        fill: make(go.Brush, "Radial", {
                            0: "rgb(240, 240, 240)",
                            0.3: "rgb(240, 240, 240)",
                            1: "rgba(240, 240, 240, 0)"
                        }),
                        stroke: null
                    }),
                make(go.TextBlock, "transition", // the label text
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
    return myDiagram;
}