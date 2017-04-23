function residensHistoryForMembers(dispatch, configureStore) {

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
					residenses: [eventdata.member.address]
				};
			},
			onMemberHasMoved(eventdata) {
				if (!members[eventdata.name]) {
					throw new Error(`onMemberHasMoved failed. ${eventdata.name} is not a member.`)
				}
				//TODO: Add this as a new address
				members[eventdata.name].residenses = [...members[eventdata.name].residenses, eventdata.address];
			},
			onAddressCorrected(eventdata) {
				if (!members[eventdata.name]) {
					throw new Error(`onAddressCorrected failed. ${eventdata.name} is not a member.`)
				}
				//TODO: update latest address
				let len = members[eventdata.name].residenses.length;
				members[eventdata.name].residenses = [...members[eventdata.name].residenses.slice(0, len - 1), eventdata.address];
			}
		}
	});



	this.listMembers = function () {
		return Object.keys(members).map(key => Object.assign({
			name: key
		}, members[key]));
	}
}

module.exports = residensHistoryForMembers;