function MemberListDomainModel(dispatch, logAggregator) {

    // let log = console.log;
    let log = () => {};

    this.registerNewMember = function(member) {
        dispatch("newMemberRegistered", {
            member
        });
        log("MAIL -> welcome to new member");
    }

    this.endMembership = function(name) {
        dispatch("membershipEnded", {
            name
        });
        log("MAIL -> goodbye to member");
    }

    this.correctAddress = function(name, address) {
        dispatch("addressCorrected", {
            name,
            address
        });
    }

    this.memberHasMoved = function(name, address) {
        dispatch("memberHasMoved", {
            name,
            address
        });
    }

    this.listMembers = function() {
		let members = logAggregator.getMembers();
        return Object.keys(members).map(key => Object.assign({
            name: key
        }, members[key]));
    }
}


function MemberListLogAggregator(snapshotData, wrapInReadOnlyProxy) {
	let members = snapshotData || [];

	this.createSnapshotData = () => members;

	this.getMembers = () => wrapInReadOnlyProxy(members);

    this.eventHandlers = {
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
}


let memberListModelDefinition = {
    snapshotConfiguration: {
		snapshotName: "memberlist",
		createSnapshotData: logAggregator => logAggregator.createSnapshotData()
	},
	getEventHandlers: logAggregator => logAggregator.eventHandlers,
	createLogAggregator: (snapshotData, wrapInReadOnlyProxy) => new MemberListLogAggregator(snapshotData, wrapInReadOnlyProxy),
	createDomainModel: (dispatch, logAggregator) => new MemberListDomainModel(dispatch, logAggregator)
};


module.exports = memberListModelDefinition;