
function ContactList(dispatch, registerEventhandlers, registerSnapshothandlers){

	let contacts = {};

	registerSnapshothandlers({
		createSnapshotData(){
			return {contacts};
		},
		restoreFromSnapshot(contents){
			contacts = contents.contacts;
		}
	});

	registerEventhandlers({
		onContactAdded(event){
			if(!contacts[event.contact.name])
			{
				contacts[event.contact.name] = event.contact;
				return;
			}
			throw new Error("Contact already exists");
		},
		onContactRemoved(event){
			if(contacts[event.contactname])
			{
				delete contacts[event.contactname];
				return;
			}
			throw new Error("Contact doesnt exist");			
		},
		onContactReplaced(event){
			if(contacts[event.contact.name])
			{
				contacts[event.contact.name] = event.contacts;
				return;
			}
			throw new Error("Contact doesnt exist");			
		}
	});


	this.addContact = (contact) => {
		dispatch("contactAdded", {contact});
	};

	this.removeContact = (contactname) => {
		dispatch("contactRemoved", {contactname});
	};

	this.replaceContact = (contactname, replacecontact) => {
		dispatch("contactReplaced", {contactname, replacecontact});
	};

	this.getAllContacts = () => {
		return Object.keys(contacts).map(key => contacts[key]);
	};

	this.getContactByName = (name) => {
		return contacts[name];
	};
}

module.exports = ContactList;
