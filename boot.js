var color = 'gray';
var len = undefined;
var gfactor = 0.005;
var tgroups = 0;
var nodes = [];
var edges = [];
var membersDic = {};
var membersCalls = [];
var network_options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    nodes: {
        shape: 'dot',
        scaling: {
            min: 0.05,
            max: 50
        },
        font: {
            size: 30,
            color: '#ffffff',
            face: 'Tahoma'
        }
    },
    edges: {
        width: 0.15,
        color: {
            inherit: 'from'
        },
        smooth: {
            type: 'continuous'
        }
    },
    physics: {
        stabilization: false,
        barnesHut: {
            gravitationalConstant: -80000,
            springConstant: 0.001,
            springLength: 200
        }
    },
    interaction: {
        tooltipDelay: 200,
        hideEdgesOnDrag: true
    },
    layout: {
        improvedLayout: false
    }
};
var api = axios.create({
    baseURL: 'https://mallorcajs.azurewebsites.net/api'
});
api.get('/mgroups')
    .then(function (groups) {
        // console.log(groups);
        groups.data.sort(function (a, b) {
            return a.members - b.members;
        });
        groups.data.forEach(function (group, index) {
            nodes.push({
                id: group.id,
                label: `${group.name} (${group.members})`,
                value: gfactor * group.members,
                title: `${group.name} (${group.members})`,
                group: tgroups
            });
            // console.log(`Group: ${group.urlname} ${group.members}`);
            membersCalls.push(api.get('/mmembers', {
                params: { 'group_id' : group.id }
            }));
            // membersCalls.push(api.get(`/${group.urlname}/members`, {
            //     params: membersParams
            // }));
            tgroups++;
        })

        axios.all(membersCalls)
            .then(axios.spread(function (...names) {
                var tmembers = 0;                
                // console.log(names);
                names.forEach(function (members, index) {
                    // console.log(members);
                    members.data.results.forEach(function (member, index) {
                        if (!(member.id in membersDic)) {
                            // console.log(member);
                            membersDic[member.id] = member;
                            if (!('photo' in member)) {
                                nodes.push({
                                    id: member.id,
                                    label: member.name,
                                    group: tgroups
                                });
                            } else {
                                nodes.push({
                                    id: member.id,
                                    label: member.name,
                                    shape: 'circularImage',
                                    image: member.photo.thumb_link,
                                    group: tgroups
                                });
                            }
                            tmembers++;
                        }
                        // if(('role' in member.group_profile)) {
                        //    // TODO
                        // }
                        edges.push({
                            // from: member.group_profile.group.id,
                            from: members.config.params.group_id,
                            to: member.id
                        });
                    })
                })
                // console.log("total members: " + tmembers);

                var container = document.getElementById('mynetwork');
                var data = {
                    nodes: new vis.DataSet(nodes),
                    edges: new vis.DataSet(edges)
                };

                // create a network
                network = new vis.Network(container, data, network_options);
                                
                // network.on("click", function (e) {
                //     //Zoom only on single node clicks, zoom out otherwise
                //     if (e.nodes.length !== 1) {
                //         network.fit();
                //         return;
                //     }
                //     var nodeId = e.nodes[0];
                //     //Find out what group the node belongs to
                //     var group = getGroup(nodeId);
                //     //TODO: How do you want to handle ungrouped nodes?
                //     if (group === undefined) return;
                //     var groupNodes = getGroupNodes(group);
                //     network.fit({
                //         nodes: groupNodes
                //     });
                // });

            }));
    });