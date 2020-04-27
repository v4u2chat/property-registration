'use strict';

class Utils {

	static transactionMap = {
		'upg100' : 100,
		'upg500' : 500,
		'upg1000' : 1000
	};

	static propertyStatusMap = {
		'requested' : 'REQUESTED',
		'registered' : 'REGISTERED',
		'onSale' : 'ON_SALE'
	};
	
	static generateUserCompositeUserKey = function(name, aadhaarNo) {
		return ctx.stub.createCompositeKey('org.property-registration-network.regnet.user', [name,aadhaarNo]);
	}
	
	static generateRegistrarCompositeUserKey = function(name, aadhaarNo) {
		return ctx.stub.createCompositeKey('org.property-registration-network.regnet.registrar', [name,aadhaarNo]);
	}

	static generatePropertyCompositeUserKey = function(propertyId) {
		return ctx.stub.createCompositeKey('org.property-registration-network.regnet.property', [propertyId]);
	}

	static getStateFromLedger = function(ctx,compositeKey){
		let dataBuffer = await ctx.stub
				.getState(compositeKey)
				.catch(err => console.log(err));
		return JSON.parse(dataBuffer.toString());
	}
	
}

module.exports = Utils;