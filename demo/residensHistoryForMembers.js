function residensHistoryForMembers(dispatch, registerEventHandlers, registerSnapshotHandlers) {

	let members = {};

	registerSnapshotHandlers({
		createSnapshotData() {
			return members;
		},
		restoreFromSnapshot(contents) {
			members = contents;
		}
	});

	registerEventHandlers({
		onNewMemberRegistered(event){
			if(members[event.member.name]){
				throw new Error(`onNewMemberRegistered failed. ${event.member.name} is allready a member.`)
			}
			members[event.member.name] = {residenses: [event.member.address]};
		},
		onMemberHasMoved(event){
			if(!members[event.name]){
				throw new Error(`onMemberHasMoved failed. ${event.name} is not a member.`)
			}
			//TODO: Add this as a new address
			members[event.name].residenses =  [...members[event.name].residenses, event.address];
		},
		onAddressCorrected(event){
			if(!members[event.name]){
				throw new Error(`onAddressCorrected failed. ${event.name} is not a member.`)
			}
			//TODO: update latest address
			let len = members[event.name].residenses.length;
			members[event.name].residenses =  [...members[event.name].residenses.slice(0, len-1), event.address];			
		}
	});



	this.listMembers = function(){
		return Object.keys(members).map(key => Object.assign({name: key}, members[key]));
	}
}

module.exports = residensHistoryForMembers;