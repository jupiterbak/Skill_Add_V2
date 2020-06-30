/**
 * Copyright 2019 Siemens AG.
 * 
 * File: SkillVis.js
 * Project: SP 347
 * Author:
 *  - Jupiter Bakakeu
 **/

const opcua = require("node-opcua");
var hasOwnNestedProperty = function(obj, propertyPath) {
    if (!propertyPath)
        return false;

    var properties = propertyPath.split('.');

    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];

        if (!obj || !obj.hasOwnProperty(prop)) {
            return false;
        } else {
            obj = obj[prop];
        }
    }

    return true;
};


class Skill {
    constructor(logger, opcua_server) {
        this.logger = logger;
        this.addressSpace = opcua_server.engine.addressSpace;

        // get the namespace Index
        this.skill_namespace_index = null;

        this.start_method = null;
        this.results_errorID_node= null;
        this.results_valueOut_node= null;
        this.xRequestProvided_node = null;
        this.xResultAcknowledge_node = null;


        this.call_result = 0;
    }

    initialize() {
        var self = this;
        // get the namespace Index
        this.skill_namespace_index = this.addressSpace.getNamespaceIndex("http://www.siemens.com/simatic-s7-opcua");
        this.skill_type_namespace_index = this.addressSpace.getNamespaceIndex("http://www.siemens.com/AutomationSkills");

        // Find the methods and nodes
        this.start_method_node = this.addressSpace.findNode("ns=" + this.skill_namespace_index + ";s=\"Skill_Add_DB\"");
        this.results_errorID_node= this.addressSpace.findNode("ns=" + this.skill_namespace_index + ";s=\"Skill_Insert_DB\".\"Result\".\"ErrorId\"");
        this.results_valueOut_node= this.addressSpace.findNode("ns=" + this.skill_namespace_index + ";s=\"Skill_Insert_DB\".\"Result\".\"valueOut\"");
        this.xRequestProvided_node = this.addressSpace.findNode("ns=" + this.skill_namespace_index + ";s=\"Skill_Insert_DB\".\"xRequestProvided\"");
        this.xResultAcknowledge_node = this.addressSpace.findNode("ns=" + this.skill_namespace_index + ";s=\"Skill_Insert_DB\".\"xResultAcknowledge\"");

        this.start_method = this.addressSpace.findMethod(this.start_method_node.nodeId);
        // Bind the methods
        this.start_method.bindMethod((inputArguments, context, callback) => {
            self.startSkillMethod(inputArguments, context, callback);
        });

        // Set the skill results flags
        self.xRequestProvided_node.setValueFromSource({ dataType: opcua.DataType.Boolean, value: false }, opcua.StatusCodes.Good, new Date());
        self.xResultAcknowledge_node.setValueFromSource({ dataType: opcua.DataType.Boolean, value: true }, opcua.StatusCodes.Good, new Date());
    }

    startSkillMethod(inputArguments, context, callback) {
        var self = this;
        this.logger.info("StartSkill is called.");

        const _current_xResultAcknowledge = self.xResultAcknowledge_node.readValue();

        // if(_current_xResultAcknowledge.value.value !== true){
        //     const callMethodResult = {
        //         statusCode: opcua.StatusCodes.Good,
        //         outputArguments: [{
        //             dataType: opcua.DataType.Int16,
        //             value: 0x88 // Example of ErrorCode
        //         }]
        //     };
        //     callback(null, callMethodResult);
        // }else{
            // Check Parameters
            if(inputArguments[0].value && inputArguments[1].value){
                const callMethodResult = {
                    statusCode: opcua.StatusCodes.Good,
                    outputArguments: [{
                        dataType: opcua.DataType.Int16,
                        value: 0x0 // Example of ErrorCode
                    }]
                };
                // Save results
                this.call_result = inputArguments[0].value + inputArguments[1].value;
                
                // return the method results
                callback(null, callMethodResult);

                setTimeout(() => {
                    // Set the skill results 
                    self.results_errorID_node.setValueFromSource({ dataType: opcua.DataType.Int16, value: 0 }, opcua.StatusCodes.Good, new Date());  
                    self.results_valueOut_node.setValueFromSource({ dataType: opcua.DataType.Double, value: self.call_result }, opcua.StatusCodes.Good, new Date());

                    // reset xRequestProvided
                    self.xRequestProvided_node.setValueFromSource({ dataType: opcua.DataType.Boolean, value: false }, opcua.StatusCodes.Good, new Date());
                    self.xResultAcknowledge_node.setValueFromSource({ dataType: opcua.DataType.Boolean, value: false }, opcua.StatusCodes.Good, new Date());     
                }, 2000);
            }else{
                const callMethodResult = {
                    statusCode: opcua.StatusCodes.Good,
                    outputArguments: [{
                        dataType: opcua.DataType.Int16,
                        value: 0x8000 // Example of ErrorCode
                    }]
                };
                callback(null, callMethodResult);
            }
        //}      
    }

    start() {
    }

    stop() {
    }

    clear() {
    }
}

module.exports = Skill;