function AllHistoricalMemberList(dispatch, registerEventHandlers, registerSnapshotHandlers) {

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
			members[event.member.name] = {address: event.member.address, membershipLevel: event.member.membershipLevel, isMember: true};
		},
		onMembershipEnded(event){
			if(!members[event.name]){
				throw new Error(`onMembershipEnded failed. ${event.name} is not a member.`)
			}
			members[event.name].isMember = false;
		}
	});



	this.listMembers = function(){
		return Object.keys(members).map(key => Object.assign({name: key}, members[key]));
	}
}

module.exports = AllHistoricalMemberList;