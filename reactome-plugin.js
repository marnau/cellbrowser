/*
 * Copyright (c) 2012 Ruben Sanchez (ICM-CIPF)
 * Copyright (c) 2012 Francisco Salavert (ICM-CIPF)
 * Copyright (c) 2012 Ignacio Medina (ICM-CIPF)
 *
 * This file is part of Cell Browser.
 *
 * Cell Browser is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cell Browser is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cell Browser. If not, see <http://www.gnu.org/licenses/>.
 */

function ReactomePlugin(cellbrowser) {
	this.id = Math.round(Math.random() * 10000000);
	
	this.nodeNameIdDic = {};
	this.nodeIdNameDic = {};
	this.pathwayComponents = {};
	this.reusedNodes = {};
	this.cellbrowser = cellbrowser;
};

ReactomePlugin.prototype.draw = function() {
	var _this = this;
	
	var speciesSelected = "hsapiens", pathwaySelected;
	var speciesStore = Ext.create('Ext.data.Store', {
		fields: [ 'name', 'value' ],
		data: [
		       {name:"Homo sapiens", value:"hsapiens"},
		       {name:"Mus musculus", value:"mmusculus"},
		       {name:"Rattus norvegicus", value:"rnorvegicus"},
		       {name:"Bos taurus", value:"btaurus"},
		       {name:"Gallus gallus", value:"ggallus"},
		       {name:"Sus scrofa", value:"sscrofa"},
		       {name:"Canis familiaris", value:"cfamiliaris"},
		       {name:"Drosophila melanogaster", value:"dmelanogaster"},
		       {name:"Caenorhabditis elegans", value:"celegans"},
		       {name:"Saccharomyces cerevisiae", value:"scerevisiae"},
		       {name:"Danio rerio", value:"drerio"},
		       {name:"Schizosaccharomyces pombe", value:"spombe"},
		       {name:"Escherichia coli", value:"ecoli"},
		       {name:"Human immunodeficiency virus 1", value:"hiv-1"},
		       {name:"Influenza A virus", value:"flu-a"},
		       {name:"Clostridium botulinum", value:"cbotulinum"},
		       {name:"Arabidopsis thaliana", value:"athaliana"},
		       {name:"Plasmodium falciparum", value:"pfalciparum"},
		       {name:"Dictyostelium discoideum", value:"ddiscoideum"},
		       {name:"Mycobacterium tuberculosis", value:"mtuberculosis"},
		       {name:"Neisseria meningitidis serogroup B", value:"nmeningitidis"},
		       {name:"Chlamydia trachomatis", value:"ctrachomatis"},
		       {name:"Oryza sativa", value:"osativa"},
		       {name:"Toxoplasma gondii", value:"tgondii"},
		       {name:"Xenopus tropicalis", value:"xtropicalis"},
		       {name:"Salmonella typhimurium", value:"styphimurium"},
		       {name:"Taeniopygia guttata", value:"tguttata"},
		       {name:"Staphylococcus aureus N315", value:"saureus"}
		      ]
	});
	
    var speciesCombo = Ext.create('Ext.form.field.ComboBox', {
    	margin: "2 2 3 8",
    	width: 318,
    	labelWidth: 60,
    	fieldLabel: 'Species',
    	value: speciesSelected,
    	allowBlank: false,
    	editable: false,
    	displayField: 'name',
    	valueField: 'value',
    	queryMode: 'local',
    	store: speciesStore,
    	listeners: {
    		change: function(combo, newValue, oldValue){
                speciesSelected = newValue;
                renderTree();
            }
    	}
    });
    
    var selectionType = Ext.create('Ext.form.RadioGroup' , {
	    fieldLabel: 'Selection',
	    border: '1 0 1 0',
	    style: {
	        borderColor: '#D0D0D0',
	        borderStyle: 'solid'
	    },
	    labelWidth: 60,
	    margin: "2 2 0 8",
	    width: 320,
	    items: [
	        { boxLabel: 'Single', name: 'st', inputValue: 'single', checked: true},
	        { boxLabel: 'Multiple', name: 'st', inputValue: 'multiple'}
	    ]
	});
	
	Ext.define('pathwayModel', {
	    extend: 'Ext.data.Model',
	    fields: [
	             {name:'text', mapping: 'displayName'},
	             {name:'name', mapping: 'name'},
	             {name:'checked', defaultValue: false, disabled: true}
//	             {name:'children', mapping :'subPathways'}
	            ]
	});
	
	var treeStore = Ext.create('Ext.data.TreeStore', {
		model: 'pathwayModel',
        root: {
            title: 'Pathways',
            expand: true,
            children:[]
        }
    });
	
    var tree = Ext.create('Ext.tree.Panel', {
        store: treeStore,
        margin: '2 0 0 0',
        rootVisible: false,
        useArrows: true,
        viewConfig:{
            markDirty:false
        },
        listeners: {
        	itemclick : function(i, record, item, index, e, eOpts) {
        		pathwaySelected = record.raw.name;
        		var selectMode = selectionType.getChecked()[0].inputValue;
        		
        		if(selectMode == "multiple") {
        			if(record.data.checked) {
        				_this.removePathway(pathwaySelected);
        			}
        			else {
        				_this.addPathway(speciesSelected, pathwaySelected);
        			}
        		}
        		else {
        			var itemsChecked = this.getChecked();
        			for(var i=0; i<itemsChecked.length; i++) {
        				itemsChecked[i].set("checked", false);
        			}
        			_this.loadPathway(speciesSelected, pathwaySelected);
        		}
        		record.set("checked", !record.data.checked);
        	}
        }
    });
    
    var searchTb = Ext.create('Ext.form.field.Text', {
    	margin: "2 0 2 2",
		width: 330,
		colspan: 2,
		emptyText: "search text",
    	listeners: {
    		change: function (event, newValue, oldValue, eOpts) {
    			if(newValue.length > 0) searchBtn.enable();
    			else searchBtn.disable();
    		}
    	}
    });
    
    var searchBtn = Ext.create('Ext.button.Button', {
    	margin: "2 2 2 2",
    	text: "Go",
    	disabled: true,
    	listeners: {
    		click: function (btn, event, eOpts) {
    			tree.setLoading(true);
    			tree.collapseAll();
    			var rootNode = tree.getRootNode();
    			
    			//remove style for each node
    			rootNode.cascadeBy(function(node){
    				var nodeText = node.get("text");
    				if(!(nodeText instanceof Array)) {
    					var newText = nodeText.replace("<span class='err'>", "").replace("</span>", "");
    					node.set("text", newText);
    				}
    			});
    			
    			var searchText = searchTb.getValue();
    			var searchBy = searchRadioGrp.getChecked()[0].inputValue;
    			
    			$.ajax({url: CB_CELLBASE_HOST+"/latest/"+speciesSelected+"/network/reactome-pathway/search?by="+searchBy+"&text="+searchText+"&onlyIds=true", success:function(data) {
    				var json = JSON.parse(data);
    				
    				for(var i=0, len=json.length; i<len; i++) {
    					var child = rootNode.findChild("name", json[i].name, true);
//    					child.set("checked", true);
//    					child.expand();
    					child.set("text", "<span class='err'>"+child.get("text")+"</span>");
    					tree.expandPath(child.getPath("name"), "name");
    				}
    				tree.setLoading(false);
    			}});
    		}
    	}
    });
    
    var searchRadioGrp = Ext.create('Ext.form.RadioGroup' , {
	    fieldLabel: 'Search by',
	    labelWidth: 80,
	    margin: "2 2 2 4",
	    width: 296,
//	    columns: 3,
//	    vertical: false,
//	    columnWidth: '50',
	    items: [
	        { boxLabel: 'Pathway', name: 'rb', inputValue: 'pathway', checked: true},
	        { boxLabel: 'Other', name: 'rb', inputValue: 'other'}
	    ]
	});
    
    var searchPanel = Ext.create('Ext.panel.Panel', {
    	width: 340,
    	collapsible: true,
    	collapsed: true,
    	title: 'Search',
    	layout: {
    		type: 'table',
    		columns: 2
    	},
    	items: [searchTb, searchRadioGrp, searchBtn]
    });
    
	var window = Ext.create('Ext.ux.Window', {
		title : "Reactome plugin",
		taskbar: Ext.getCmp(this.cellbrowser.networkViewer.id+'uxTaskbar'),
		height : 500,
		width : 350,
		layout : "fit",
		tbar: {
			layout: 'vbox',
			items: [speciesCombo, selectionType]
		},
		bbar: [searchPanel],
		items : tree
	}).show();
	
	
	renderTree();
	
	function renderTree(){
		tree.setLoading(true);
		$.ajax({url: CB_CELLBASE_HOST+"/latest/"+speciesSelected+"/network/reactome-pathway/tree", success:function(data) {
			var json = JSON.parse(data.replace(/\"subPathways\" : \[ \]/g,"\"leaf\":true").replace(/subPathways/g,"children"));
			treeStore.setRootNode({
				children:json
			});
			tree.setLoading(false);
		}});
	}
	
};

ReactomePlugin.prototype.loadPathway = function(speciesSelected, pathwayId){
	var _this = this;

	//	_this.cellbrowser.clearNetwork();
	_this.nodeNameIdDic = {};
	_this.nodeIdNameDic = {};
	_this.pathwayComponents = {};
	_this.cellbrowser.networkViewer.networkData = new NetworkData();
	
	_this.pathwayComponents[pathwayId] = {};
	
	$.ajax({url: CB_CELLBASE_HOST+"/latest/"+speciesSelected+"/network/reactome-pathway/"+pathwayId+"/info", success:function(data) {
		var json = JSON.parse(data)[0];
		for(var i=0, len=json.subPathways.length; i<len; i++) {
			var nodeId = _this.addPathwayNode(json.subPathways[i].name, json.subPathways[i].displayName[0], speciesSelected);
			var name = json.subPathways[i].name;
//			if(nodeId != -1) _this.pathwayComponents[pathwayId][nodeId] = true;
			_this.pathwayComponents[pathwayId][_this.nodeNameIdDic[name]] = true;
			if(!_this.reusedNodes[name]) _this.reusedNodes[name] = {};
			_this.reusedNodes[name][pathwayId] = true;
		}
		
		for(var i=0, len=json.physicalEntities.length; i<len; i++) {
			var nodeId = _this.addPhysicalEntity(json.physicalEntities[i].name, json.physicalEntities[i].type, json.physicalEntities[i].params.displayName[0], json.physicalEntities[i].params);
			var name = json.physicalEntities[i].name;
//			if(nodeId != -1) _this.pathwayComponents[pathwayId].push(nodeId);
			_this.pathwayComponents[pathwayId][_this.nodeNameIdDic[name]] = true;
			if(!_this.reusedNodes[name]) _this.reusedNodes[name] = {};
			_this.reusedNodes[name][pathwayId] = true;
		}
		
		for(var i=0, len=json.interactions.length; i<len; i++) {
			var nodeId = _this.addInteraction(json.interactions[i]);
			var name = json.interactions[i].name;
//			if(nodeId != -1) _this.pathwayComponents[pathwayId].push(nodeId);
			_this.pathwayComponents[pathwayId][_this.nodeNameIdDic[name]] = true;
			if(!_this.reusedNodes[name]) _this.reusedNodes[name] = {};
			_this.reusedNodes[name][pathwayId] = true;
		}
		
		_this.cellbrowser.refresh(_this.cellbrowser.networkViewer.networkData);
	}});
};

ReactomePlugin.prototype.addPathway = function(speciesSelected, pathwayId){
	var _this = this;
	_this.pathwayComponents[pathwayId] = {};
	
	$.ajax({url: CB_CELLBASE_HOST+"/latest/"+speciesSelected+"/network/reactome-pathway/"+pathwayId+"/info", success:function(data) {
		var json = JSON.parse(data)[0];
		
		for(var i=0, len=json.subPathways.length; i<len; i++) {
			var nodeId = _this.addPathwayNode(json.subPathways[i].name, json.subPathways[i].displayName[0], speciesSelected);
			var name = json.subPathways[i].name;
//			if(nodeId != -1) _this.pathwayComponents[pathwayId].push(nodeId);
			_this.pathwayComponents[pathwayId][_this.nodeNameIdDic[name]] = true;
			if(!_this.reusedNodes[name]) _this.reusedNodes[name] = {};
			_this.reusedNodes[name][pathwayId] = true;
		}
		
		for(var i=0, len=json.physicalEntities.length; i<len; i++) {
			var nodeId = _this.addPhysicalEntity(json.physicalEntities[i].name, json.physicalEntities[i].type, json.physicalEntities[i].params.displayName[0], json.physicalEntities[i].params);
			var name = json.physicalEntities[i].name;
//			if(nodeId != -1) _this.pathwayComponents[pathwayId].push(nodeId);
			_this.pathwayComponents[pathwayId][_this.nodeNameIdDic[name]] = true;
			if(!_this.reusedNodes[name]) _this.reusedNodes[name] = {};
			_this.reusedNodes[name][pathwayId] = true;
		}
		
		for(var i=0, len=json.interactions.length; i<len; i++) {
			var nodeId = _this.addInteraction(json.interactions[i]);
			var name = json.interactions[i].name;
//			if(nodeId != -1) _this.pathwayComponents[pathwayId].push(nodeId);
			_this.pathwayComponents[pathwayId][_this.nodeNameIdDic[name]] = true;
			if(!_this.reusedNodes[name]) _this.reusedNodes[name] = {};
			_this.reusedNodes[name][pathwayId] = true;
		}
		
		_this.cellbrowser.refresh(_this.cellbrowser.networkViewer.networkData);
	}});
};

ReactomePlugin.prototype.removePathway = function(pathwayId) {
//	console.log(this.reusedNodes);
//	debugger
//	for(var i=0, len=this.pathwayComponents[pathwayId].length; i<len; i++) {
//		var node = this.nodeIdNameDic[this.pathwayComponents[pathwayId][i]];
//		
//		var size = 0, key;
//	    for (key in this.reusedNodes[node]) {
//	        if (this.reusedNodes[node].hasOwnProperty(key)) size++;
//	    }
//	    
//	    if(size > 1) {
//	    	console.log("Node with size > 1: "+node);
//	    }
//		
//		if(size <= 1) {
//			this.cellbrowser.removeNode(this.pathwayComponents[pathwayId][i]);
//		}
////		for(var j=0,lenj=this.reusedNodes[node].length; j<lenj; j++) {
////			if(this.reusedNodes[node][j] == pathwayId) {
////				this.reusedNodes[node].splice(j, 1);
////			}
////		}
//		delete this.reusedNodes[node][pathwayId];
//	}
	
	for(var comp in this.pathwayComponents[pathwayId]) {
		var node = this.nodeIdNameDic[comp];
		
		var size = 0, key;
	    for (key in this.reusedNodes[node]) {
	        if (this.reusedNodes[node].hasOwnProperty(key)) size++;
	    }
		
		if(size <= 1) {
			this.cellbrowser.removeNode(comp);
		}
		
		delete this.reusedNodes[node][pathwayId];
	}
	
	delete this.pathwayComponents[pathwayId];
	
	this.cellbrowser.refresh(this.cellbrowser.networkViewer.networkData);
};

ReactomePlugin.prototype.addPathwayNode = function(name, displayName, species) {
	var args = {};
	args.name = name;
	args.type = "pathway";
	args.metainfo = {
		"label": displayName,
		"qtipScope": this,
		"qtipFn": "qtipScope.loadPathway('"+species+"','"+name+"');",
		"qtipContent": '<b style="cursor:pointer" class="link">Open pathway</b>'
	};
	
	var nodeId = this.cellbrowser.addNode(args);
	if(nodeId != -1) {
		this.nodeNameIdDic[name] = nodeId;
		this.nodeIdNameDic[nodeId] = name;
	}
	
	return nodeId;
};

ReactomePlugin.prototype.addPhysicalEntity = function(name, type, displayName, params) {
	var args = {};
	args.name = name;
	args.type = type;
	args.metainfo = params;
	args.metainfo.label = displayName;
	
	var nodeId = this.cellbrowser.addNode(args);
	if(nodeId != -1) {
		this.nodeNameIdDic[name] = nodeId;
		this.nodeIdNameDic[nodeId] = name;
	}
	
	return nodeId;
};

ReactomePlugin.prototype.addInteraction = function(interaction) {
	var nodeArgs = {};
	var name = interaction.name;
	nodeArgs.name = name;
	nodeArgs.type = "interaction";
	nodeArgs.metainfo = interaction.params;
	nodeArgs.metainfo.label = interaction.params.displayName[0];
	
	var nodeId = this.cellbrowser.addNode(nodeArgs);
	if(nodeId != -1) {
		this.nodeNameIdDic[name] = nodeId;
		this.nodeIdNameDic[nodeId] = name;
	}
	
	//TODO completar los tipos de interaccion
//	console.log(interaction.type);
	
	switch (interaction.type) {
	case "BiochemicalReaction":
		for(var i=0, len=interaction.params["left"].length; i<len; i++) {
			var leftId = interaction.params["left"][i].id;
			var edgeArgs = {};
			edgeArgs.source = this.nodeNameIdDic[leftId];
			edgeArgs.target = nodeId;
			edgeArgs.type = "odot";
			edgeArgs.name = "";
			edgeArgs.params = {};
			this.cellbrowser.addEdge(edgeArgs);
		}
		
		for(var i=0, len=interaction.params["right"].length; i<len; i++) {
			var rightId = interaction.params["right"][i].id;
			var edgeArgs = {};
			edgeArgs.source = nodeId;
			edgeArgs.target = this.nodeNameIdDic[rightId];
			edgeArgs.type = "directed";
			edgeArgs.name = "";
			edgeArgs.params = {};
			this.cellbrowser.addEdge(edgeArgs);
		}
		break;
	case "TemplateReaction":
		for(var i=0, len=interaction.params["product-id"].length; i<len; i++) {
			var productId = interaction.params["product-id"][i];
			var edgeArgs = {};
			edgeArgs.source = nodeId;
			edgeArgs.target = this.nodeNameIdDic[productId];
			edgeArgs.type = "directed";
			edgeArgs.name = "";
			edgeArgs.params = {};
			this.cellbrowser.addEdge(edgeArgs);
		}
		break;

	default:
		break;
	}
	
	return nodeId;
};
