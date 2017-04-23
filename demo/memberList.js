function MemberList(dispatch, configureStore) {

	let members = {};

	configureStore({
		createSnapshotData() {
			return members;
		},
		restoreFromSnapshot(contents) {
			members = contents;
		},
		eventhandlers: {
			onNewMemberRegistered(event) {
				if (members[event.member.name]) {
					throw new Error(`onNewMemberRegistered failed. ${event.member.name} is allready a member.`)
				}
				members[event.member.name] = {
					address: event.member.address,
					membershipLevel: event.member.membershipLevel
				};
			},
			onMembershipEnded(event) {
				if (!members[event.name]) {
					throw new Error(`onMembershipEnded failed. ${event.name} is not a member.`)
				}
				delete members[event.name];
			},
			onAddressCorrected(event) {
				if (!members[event.name]) {
					throw new Error(`onAddressCorrected failed. ${event.name} is not a member.`)
				}
				members[event.name].address = event.address;
			},
			onMemberHasMoved(event) {
				if (!members[event.name]) {
					throw new Error(`onMemberHasMoved failed. ${event.name} is not a member.`)
				}
				members[event.name].address = event.address;
			}
		}
	})
	// registerSnapshotHandlers({
	// 	createSnapshotData() {
	// 		return members;
	// 	},
	// 	restoreFromSnapshot(contents) {
	// 		members = contents;
	// 	}
	// });

	// registerEventHandlers({
	// 	onNewMemberRegistered(event){
	// 		if(members[event.member.name]){
	// 			throw new Error(`onNewMemberRegistered failed. ${event.member.name} is allready a member.`)
	// 		}
	// 		members[event.member.name] = {address: event.member.address, membershipLevel: event.member.membershipLevel};
	// 	},
	// 	onMembershipEnded(event){
	// 		if(!members[event.name]){
	// 			throw new Error(`onMembershipEnded failed. ${event.name} is not a member.`)
	// 		}
	// 		delete members[event.name];
	// 	},
	// 	onAddressCorrected(event){
	// 		if(!members[event.name]){
	// 			throw new Error(`onAddressCorrected failed. ${event.name} is not a member.`)
	// 		}
	// 		members[event.name].address = event.address;
	// 	},
	// 	onMemberHasMoved(event){
	// 		if(!members[event.name]){
	// 			throw new Error(`onMemberHasMoved failed. ${event.name} is not a member.`)
	// 		}
	// 		members[event.name].address = event.address;
	// 	}
	// });



	this.registerNewMember = function (member) {
		dispatch("newMemberRegistered", {
			member
		});
		console.log("MAIL -> welcome to new member");
	}

	this.endMembership = function (name) {
		dispatch("membershipEnded", {
			name
		});
		console.log("MAIL -> goodbye to member");
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