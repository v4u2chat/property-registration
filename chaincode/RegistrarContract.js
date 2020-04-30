'use strict';


const {Contract} = require('fabric-contract-api');

class RegistrarContract extends Contract {

    constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.property-registration-network.regnet');
    }    
    async instantiate(ctx) {
		console.log('RegistrarContract Instantiated');
	}
	
	/**
	 * Get a User account's details from the blockchain.
	 * 
	 * Initiator: User or Registrar
	 * 
	 * @param ctx - The transaction context
	 * @param name - Name of the User
     * @param aadhaarNo - Aadhaar No of the User
	 * @returns The transaction will return the current state of requested user.
	 */
	async viewUser(ctx, name, aadhaarNo) {		

		const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.user', [name,aadhaarNo]);
		let dataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));
		if (!dataBuffer.toString()) {
			throw new Error('Invalid User Details. No user exists with provided name & aadhaarNo combination.');
		} else {
			return JSON.parse(dataBuffer.toString());
		}
	}

	/**
	 * A user registered on the network initiates a transaction to request the registrar to store their details/credentials on the ledger.
     * 
     * Initiator: Registrar
     * Output: A ‘User’ asset on the ledger
     * 
	 * @param ctx - The transaction context object
	 * @param name - Name of the User
     * @param aadhaarNo - Aadhaar No of the User
	 * @returns A ‘User’ asset on the ledger
	 */
	async approveNewUser(ctx, name, aadhaarNo) {

		if('registrarMSP'==ctx.clientIdentity.mspId){
			const userKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.user', [name,aadhaarNo]);
			let dataBuffer = await ctx.stub.getState(userKey).catch(err => console.log(err));
			if (!dataBuffer.toString()) {
				throw new Error('Invalid User Details. No user exists with provided name & aadhaarNo combination.');
			} else {
				let userObject = JSON.parse(dataBuffer.toString());
				userObject.put('upgradCoins',0);
				userObject.put('state','APPROVED');
				userObject.put('updatedBy',ctx.clientIdentity.getID());
				userObject.put('updatedAt',new Date());
				
				await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(userObject)));
				return userObject;	// Return value of new user account created to user
			}
		} else {
			throw new Error('You are not authorized to perform this operation');
		}
	}
	
	/**
	 * This function should be defined to view the current state of any property registered on the ledger.
	 * 
	 * Initiator: User or Registrar
	 * Output: A ‘Property’ asset on the ledger
	 * 
	 * @param ctx - The transaction context
	 * @param propertyId -  Ideally, it should be a string comprising of the geo-coordinates of the property to identify it. However, in this case study, we will be using simple strings such as “001” to identify the property.
	 * @returns The transaction will return the current state of any property.
	 */
	async viewProperty(ctx,propertyId){
		let propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.property', [propertyId]);
		let dataBuffer = await ctx.stub.getState(propertyKey).catch(err => console.log(err));
		if (!dataBuffer.toString()) {// Make sure Property does not already exist.
			throw new Error('Invalid Property Details. We already have a property registered with us for the given Property ID');
		} 
		return JSON.parse(dataBuffer.toString());
	}

	/**
	 * This function is used by the registrar to create a new ‘Property’ asset on the network after performing some manual checks on the request received for property registration.
	 * 
	 * Initiator: Registrar
	 * 
	 * @param ctx - The transaction context
	 * @param propertyId -  Ideally, it should be a string comprising of the geo-coordinates of the property to identify it. However, in this case study, we will be using simple strings such as “001” to identify the property.
	 * @returns The transaction will return the current state of any property.
	 */
	async approvePropertyRegistration(ctx,propertyId){

		if('registrarMSP'==ctx.clientIdentity.mspId){
			let propertyKey = ctx.stub.createCompositeKey('org.property-registration-network.regnet.property', [propertyId]);
			let dataBuffer = await ctx.stub.getState(propertyKey).catch(err => console.log(err));
			if (!dataBuffer.toString()) {
				throw new Error('Invalid Property Details. We already have a property registered with us for the given Property ID');
			} else {
				let propertyObject = JSON.parse(dataBuffer.toString());

				propertyObject.put('status', propertyStatusMap.get('registered'));
				propertyObject.put('updatedBy',ctx.clientIdentity.getID());	
				propertyObject.put('updatedAt',new Date());

				await ctx.stub.putState(propertyKey, Buffer.from(JSON.stringify(propertyObject)));
				return propertyObject;
			}
		} else {
			throw new Error('You are not authorized to perform this operation');
		}	
	}

}
module.exports = RegistrarContract;