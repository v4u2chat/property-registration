'use strict';


const {Contract} = require('fabric-contract-api');

const Utils = require('./utils.js');


class UserContract extends Contract {

    constructor() {
		// Provide a custom name to refer to this smart contract
		super('org.property-registration-network.regnet.usercontract');
    }
    

    async instantiate(ctx) {
		console.log('Regnet Smart Contract Instantiated');
    }

    /**
	 * A user registered on the network initiates a transaction to request the registrar to store their details/credentials on the ledger.
     * 
     * Initiator: User
     * Output: A ‘Request’ asset on the ledger
     * 
	 * @param ctx - The transaction context object
	 * @param name - Name of the User
	 * @param email - Email ID of the User
     * @param phoneNo - Phone No of the User
     * @param aadhaarNo - Aadhaar No of the User
	 * @returns The transaction will return the User object which got added to blockchain.
	 */
	async requestNewUser(ctx, name, email,phoneNo, aadhaarNo) {
		
		const userKey = Utils.generateUserCompositeUserKey(name,aadhaarNo);	// Create a new composite key for the new User account
		
		let existingUserObject = Utils.getStateFromLedger(ctx,userKey);	// Fetch student with given ID from blockchain
		
		// Make sure User does not already exist.
		if (existingUserObject !== undefined) {	
			throw new Error('Invalid User Details. An user with this name & aadhaarNo already exists.');
		} else {
			// Create a user object to be stored in blockchain
			let newUserObject = {
				aadhaarNo: aadhaarNo,
				name: name,
				email: email,
				state: 'REQUESTED',
				createdBy: ctx.clientIdentity.getID(),
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(newUserObject)));
			return newUserObject;
		}
	};
	

	 /**
	 * 
	 * This transaction is used by a registered user to recharge their account with ‘upgradCoins’. 
	 * Before initiating the transaction, the user needs to pay the price of the ‘upgradCoins’ that they wish to purchase; 
	 * they need to pay this to the network admin. In return, the user will get a Bank Transaction ID, which they need to pass 
	 * as a parameter at the time of initiating the transaction.
	 * 
	 * Initiator: User
	 * 
	 * @param ctx - The transaction context
	 * @param name - Name of the User
     * @param aadhaarNo - Aadhaar No of the User
	 * @param bankTransactionId - Aadhaar No of the User 
	 * @returns The transaction will return the current state of user object with updated balance.
	 */
	async rechargeAccount(ctx, name, aadhaarNo,bankTransactionId) {

		let userObject = Utils.getStateFromLedger(ctx,Utils.generateUserCompositeUserKey(name,aadhaarNo));
		if (userObject == undefined) {
			throw new Error('Invalid User Details. No user exists with provided name & aadhaarNo combination.');
		} else {

			if(transactionMap.get(bankTransactionId)){
				userObject.put('upgradCoins',userObject.get('upgradCoins')+Utils.transactionMap.get(bankTransactionId));
				await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(userObject)));
				return userObject;	// Return value of new user account created to user
	
			} else {
				throw new Error('Invalid Bank Transaction ID: ' + bankTransactionId + '.');
			}
		}
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
		return Utils.getStateFromLedger(ctx,Utils.generateUserCompositeUserKey(name,aadhaarNo));
	}

	/**
	 * This function should be initiated by the user to register the details of their property on the property-registration-network.
	 * 
	 * Initiator: User
	 * Output: A ‘Request’ asset on the ledger
	 * 
	 * @param ctx - The transaction context
	 * @param propertyId -  Ideally, it should be a string comprising of the geo-coordinates of the property to identify it. However, in this case study, we will be using simple strings such as “001” to identify the property.
	 * @param owner - The owner of the property. 
	 * @param price - The price of the property
	 * @param status - Status can take only two values: ‘registered’ and ‘onSale’. When the status of the property is set to ‘registered’, it is not listed for sale; however, when the status of the property is set to ‘onSale’, it is put on sale by its owner.
	 * @param name - Name of the User
     * @param aadhaarNo - Aadhaar No of the User
	 * @returns The transaction will return the current state of newly created property.
	 */
	async propertyRegistrationRequest(ctx,propertyId,price,status,name,aadhaarNo){

		let userKey = Utils.generateUserCompositeUserKey(name,aadhaarNo);
		let userObject = Utils.getStateFromLedger(ctx,userKey);

		let propertyKey = Utils.generatePropertyCompositeUserKey(propertyId);
		let propertyObject = Utils.getStateFromLedger(ctx,propertyKey);

		
		if (propertyObject !== undefined) {	// Make sure Property does not already exist.
			throw new Error('Invalid Property Details. We already have a property registered with us for the given Property ID');
		} 

		if (userObject == undefined) {	// Make sure User does exist.
			throw new Error('Invalid User Details. No user exists with provided name & aadhaarNo combination.');
		} 

		if(propertyStatusMap.get(status)){	// Make sure valid Status is provided
			throw new Error('Invalid Property Status : ' + status + '.');
		}

		let newPropertyObject = {
			propertyId: propertyId,
			price: price,
			state: propertyStatusMap.get(status),
			owner: userKey,
			createdBy: ctx.clientIdentity.getID(),
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await ctx.stub.putState(propertyKey, Buffer.from(JSON.stringify(newPropertyObject)));
		return newPropertyObject;	// Return value of newly added property
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
		let propertyKey = Utils.generatePropertyCompositeUserKey(propertyId);
		let propertyObject = Utils.getStateFromLedger(ctx,propertyKey);

		if (propertyObject !== undefined) {	// Make sure Property does not already exist.
			throw new Error('Invalid Property Details. We already have a property registered with us for the given Property ID');
		} 
		return propertyObject;
	}


	/**
	 * This function is invoked to change the status of the property. 
	 * 
	 * Initiator:  A registered user who has their property registered on the ledger.
	 * 
	 * @param ctx - The transaction context
	 * @param propertyId -  Ideally, it should be a string comprising of the geo-coordinates of the property to identify it. However, in this case study, we will be using simple strings such as “001” to identify the property.
	 * @param status - Status can take only two values: ‘registered’ and ‘onSale’. When the status of the property is set to ‘registered’, it is not listed for sale; however, when the status of the property is set to ‘onSale’, it is put on sale by its owner.
	 * @param name - Name of the User
     * @param aadhaarNo - Aadhaar No of the User
	 * @returns The transaction will return the current state of any property.
	 */
	async updateProperty(ctx,propertyId,status,name,aadhaarNo){

		let userKey = Utils.generateUserCompositeUserKey(name,aadhaarNo);
		let userObject = Utils.getStateFromLedger(ctx,userKey);

		let propertyKey = Utils.generatePropertyCompositeUserKey(propertyId);
		let propertyObject = Utils.getStateFromLedger(ctx,propertyKey);

		if (propertyObject !== undefined) {	// Make sure Property does not already exist.
			throw new Error('Invalid Property Details. We already have a property registered with us for the given Property ID');
		} 

		if (userObject == undefined) {	// Make sure User does exist.
			throw new Error('Invalid User Details. No user exists with provided name & aadhaarNo combination.');
		} 

		if(propertyStatusMap.get(status)){	// Make sure valid Status is provided
			throw new Error('Invalid Property Status : ' + status + '.');
		}

		if(userKey == propertyObject.get('owner')){
			propertyObject.put('status', propertyStatusMap.get(status));
			propertyObject.put('updatedBy',ctx.clientIdentity.getID());	
			propertyObject.put('updatedAt',new Date());

			await ctx.stub.putState(propertyKey, Buffer.from(JSON.stringify(propertyObject)));
			return propertyObject;

		} else {
			throw new Error('Transaction declied as requested user is not the owner of the property.');
		}
	}



	/**
	 * This function is invoked to change the status of the property. 
	 * 
	 * Initiator:  A registered user who has their property registered on the ledger.
	 * 
	 * @param ctx - The transaction context
	 * @param propertyId -  Ideally, it should be a string comprising of the geo-coordinates of the property to identify it. However, in this case study, we will be using simple strings such as “001” to identify the property.
	 * @param name - Name of the Buyer
     * @param aadhaarNo - Aadhaar No of the Buyer
	 * @returns The transaction will return the current state of any property.
	 */
	async purchaseProperty(ctx,propertyId,name,aadhaarNo){

		let userKey = Utils.generateUserCompositeUserKey(name,aadhaarNo);
		let userObject = Utils.getStateFromLedger(ctx,userKey);

		let propertyKey = Utils.generatePropertyCompositeUserKey(propertyId);
		let propertyObject = Utils.getStateFromLedger(ctx,propertyKey);

		if (propertyObject !== undefined) {	// Make sure Property does not already exist.
			throw new Error('Invalid Property Details. We already have a property registered with us for the given Property ID');
		} 

		if (userObject == undefined) {	// Make sure User does exist.
			throw new Error('Invalid User Details. No user exists with provided name & aadhaarNo combination.');
		} 

		if(propertyObject.get('status')!=propertyStatusMap.get('onSale')){	// Make sure Propert is ON SALE
			throw new Error('Property is NOT FOR SALE');
		}

		if(userKey != propertyObject.get('owner')){

			if(userObject.get('upgradCoins') >= propertyObject.get('price')){

				userObject.set('upgradCoins',userObject.get('upgradCoins') - propertyObject.get('price'));
				propertyObject.set('owner',userKey);
				propertyObject.put('status', propertyStatusMap.get('registered'));
				propertyObject.put('updatedBy',ctx.clientIdentity.getID());	
				propertyObject.put('updatedAt',new Date());

				await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(userObject)));
				await ctx.stub.putState(propertyKey, Buffer.from(JSON.stringify(propertyObject)));

				return propertyObject;
			}
			throw new Error('You do not have enough balance to buy this property.');
		} else {
			throw new Error('You are already owns this property');
		}
	}
}