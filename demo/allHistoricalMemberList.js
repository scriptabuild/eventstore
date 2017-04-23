function AllHistoricalMemberList(dispatch, configureStore) {

	let members = {};

	configureStore({
		createSnapshotData() {
			return members;
		},
		restoreFromSnapshot(contents) {
			members = contents;
		},
		eventhandlers: {
			onNewMemberRegistered(eventdata) {
				if (members[eventdata.member.name]) {
					throw new Error(`onNewMemberRegistered failed. ${eventdata.member.name} is allready a member.`)
				}
				members[eventdata.member.name] = {
					address: eventdata.member.address,
					membershipLevel: eventdata.member.membershipLevel,
					isMember: true
				};
			},
			onMembershipEnded(eventdata) {
				if (!members[eventdata.name]) {
					throw new Error(`onMembershipEnded failed. ${eventdata.name} is not a member.`)
				}
				members[eventdata.name].isMember = false;
			}
		}
	});



	this.listMembers = function () {
		return Object.keys(members).map(key => Object.assign({
			name: key
		}, members[key]));
	}
}

module.exports = AllHistoricalMemberList;