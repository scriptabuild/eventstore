function DomainModel(dispatch, logAggregator) {

    this.listMembers = function() {
		let members = logAggregator.getMembers();
        return Object.keys(members).map(key => Object.assign({
            name: key
        }, members[key]));
    }
}


function LogAggregator(snapshotData, wrapInReadOnlyProxy) {
    let members = snapshotData || {};

    this.createSnapshotData = () => wrapInReadOnlyProxy(members);

	this.getMembers = () => wrapInReadOnlyProxy(members);

    this.eventHandlers = {
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
            members[eventdata.name].residenses = [...members[eventdata.name].residenses, eventdata.address];
        },
        onAddressCorrected(eventdata) {
            if (!members[eventdata.name]) {
                throw new Error(`onAddressCorrected failed. ${eventdata.name} is not a member.`)
            }
            let len = members[eventdata.name].residenses.length;
            members[eventdata.name].residenses = [...members[eventdata.name].residenses.slice(0, len - 1), eventdata.address];
        }
    }
}


let modelDefinition = {
    snapshotConfiguration: {
        snapshotName: "residens-history",
        createSnapshotData: logAggregator => logAggregator.createSnapshotData()
    },
	getEventHandlers: logAggregator => logAggregator.eventHandlers,
	createLogAggregator: (snapshotData, wrapInReadOnlyProxy) => new LogAggregator(snapshotData, wrapInReadOnlyProxy),
	createDomainModel: (dispatch, logAggregator) => new DomainModel(dispatch, logAggregator)
}


module.exports = modelDefinition;