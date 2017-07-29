function AllHistoricalMemberListDomainModel(dispatch, logAggregator) {
    this.listMembers = function() {
		let members = logAggregator.getMembers();
        return Object.keys(members).map(key => Object.assign({
            name: key
        }, members[key]));
    }
}


function AllHistoricalMemberListLogAggregator(snapshotData, wrapInReadOnlyProxy) {
    let members = snapshotData || {};

    this.createSnapshotData = () => members;

	this.getMembers = () => wrapInReadOnlyProxy(members);

    this.eventHandlers = {
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
}


let allHistoricalMemberListModelDefinition = {
    snapshotConfiguration: {
		snapshotName: "all-historical-members"
    },
    getEventHandlers: logAggregator => logAggregator.eventHandlers,
    createLogAggregator: (snapshotData, wrapInReadOnlyProxy) => new AllHistoricalMemberListLogAggregator(snapshotData, wrapInReadOnlyProxy),
    createDomainModel: (dispatch, logAggregator) => new AllHistoricalMemberListDomainModel(dispatch, logAggregator)
};


module.exports = allHistoricalMemberListModelDefinition;