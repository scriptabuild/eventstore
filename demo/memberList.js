function MemberList(dispatch, configureStore) {

	let members = {};
	// let log = console.log;
	let log = () => {};

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
					membershipLevel: eventdata.member.membershipLevel
				};
			},
			onMembershipEnded(eventdata) {
				if (!members[eventdata.name]) {
					throw new Error(`onMembershipEnded failed. ${eventdata.name} is not a member.`)
				}
				delete members[eventdata.name];
			},
			onAddressCorrected(eventdata) {
				if (!members[eventdata.name]) {
					throw new Error(`onAddressCorrected failed. ${eventdata.name} is not a member.`)
				}
				members[eventdata.name].address = eventdata.address;
			},
			onMemberHasMoved(eventdata) {
				if (!members[eventdata.name]) {
					throw new Error(`onMemberHasMoved failed. ${eventdata.name} is not a member.`)
				}
				members[eventdata.name].address = eventdata.address;
			}
		}
	})


	this.registerNewMember = function (member) {
		dispatch("newMemberRegistered", {
			member
		});
		log("MAIL -> welcome to new member");
	}

	this.endMembership = function (name) {
		dispatch("membershipEnded", {
			name
		});
		log("MAIL -> goodbye to member");
	}

	this.correctAddress = function (name, address) {
		dispatch("addressCorrected", {
			name,
			address
		});
	}

	this.memberHasMoved = function (name, address) {
		dispatch("memberHasMoved", {
			name,
			address
		});
	}

	this.listMembers = function () {
		return Object.keys(members).map(key => Object.assign({
			name: key
		}, members[key]));
	}
}

module.exports = MemberList;