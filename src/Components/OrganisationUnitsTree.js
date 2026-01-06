import { useState, useEffect } from 'react'
import { CarryOutOutlined } from "@ant-design/icons"
import { TreeSelect } from "antd"
import { CircularLoader } from '@dhis2/ui'


const generateTreeFromOrgUnits = (ouList = [], icon = null, parentId = null, level = 1, setLoading) => {
  // Don't set loading here - org units are already loaded
  let orgUnits = ouList.map(o => {
    return {
      key: o.id,
      id: o.id,
      label: o.displayName,
      title: o.displayName,
      data: o,
      level: o.level,
      value: o.id,
      icon: icon,
      children: [],
      parent: (o.parent !== null && o.parent !== undefined) ? o.parent.id : null
    }
  })

  let nodes = parentId ? orgUnits.filter(o => o.id === parentId) : orgUnits.filter(o => o.level === level)

  nodes.forEach(o => {
    o.children = orgUnits.filter(org => org.parent === o.id)

    o.children.forEach(a => {
      a.children = orgUnits.filter(org => org.parent === a.id)

      a.children.forEach(b => {
        b.children = orgUnits.filter(org => org.parent === b.id)

        b.children.forEach(c => {
          c.children = orgUnits.filter(org => org.parent === c.id)

          c.children.forEach(d => {
            d.children = orgUnits.filter(org => org.parent === d.id)

            d.children.forEach(e => {
              e.children = orgUnits.filter(org => org.parent === e.id)

              e.children.forEach(f => {
                f.children = orgUnits.filter(org => org.parent === f.id)

                f.children.forEach(g => {
                  g.children = orgUnits.filter(org => org.parent === g.id)

                  g.children.forEach(h => {
                    h.children = orgUnits.filter(org => org.parent === h.id)

                    h.children.forEach(i => {
                      i.children = orgUnits.filter(org => org.parent === i.id)

                      i.children.forEach(j => {
                        j.children = orgUnits.filter(org => org.parent === j.id)

                        j.children.forEach(k => {
                          k.children = orgUnits.filter(org => org.parent === k.id)

                          k.children.forEach(l => {
                            l.children = orgUnits.filter(org => org.parent === l.id)

                            l.children.forEach(m => {
                              m.children = orgUnits.filter(org => org.parent === m.id)

                              m.children.forEach(n => {
                                n.children = orgUnits.filter(org => org.parent === n.id)

                                n.children.forEach(p => {
                                  p.children = orgUnits.filter(org => org.parent === p.id)

                                  p.children.forEach(q => {
                                    q.children = orgUnits.filter(org => org.parent === q.id)

                                    q.children.forEach(r => {
                                      r.children = orgUnits.filter(org => org.parent === r.id)

                                      r.children.forEach(s => {
                                        s.children = orgUnits.filter(org => org.parent === s.id)

                                        s.children.forEach(t => {
                                          t.children = orgUnits.filter(org => org.parent === t.id)

                                          t.children.forEach(u => {
                                            u.children = orgUnits.filter(org => org.parent === u.id)

                                            u.children.forEach(v => {
                                              v.children = orgUnits.filter(org => org.parent === v.id)

                                              v.children.forEach(w => {
                                                w.children = orgUnits.filter(org => org.parent === w.id)

                                                w.children.forEach(x => {
                                                  x.children = orgUnits.filter(org => org.parent === x.id)

                                                  x.children.forEach(y => {
                                                    y.children = orgUnits.filter(org => org.parent === y.id)

                                                    y.children.forEach(z => {
                                                      z.children = orgUnits.filter(org => org.parent === z.id)
                                                    })
                                                  })
                                                })
                                              })
                                            })
                                          })
                                        })
                                      })
                                    })
                                  })
                                })
                              })
                            })
                          })
                        })
                      })
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })

  setLoading && setLoading(false)

  return nodes
}


const getParentKey = (key, tree = []) => {
  let parentKey;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.children) {
      if (node.children.some((item) => item.key === key)) {
        parentKey = node.key;
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children);
      }
    }
  }
  return parentKey;
}


const OrganisationUnitsTree = ({
  setCurrentOrgUnits,
  currentOrgUnits,
  expandedKeys,
  setExpandedKeys,
  orgUnits,
  meOrgUnitId,
  loadingOrganisationUnits,
  preGeneratedTree,
}) => {
  const [tree, setTree] = useState(preGeneratedTree || [])
  const [expandAll, setExpandAll] = useState(false)

  // const onInputTextChange = ({ value }) => {
  //   setInputText(''.concat(value))
  // }


  // const searchAndUpdateTreeView = () => {
  //   setLoadingSearch(true)

  //   const newExpandedKeys = []
  //   for (let ou of orgUnits.filter(ou => inputText?.trim()?.length > 0 ? ou.displayName.toLowerCase().indexOf(inputText?.toLowerCase()) > -1 : true)) {
  //     const key = getParentKey(ou.id, tree)
  //     if (!newExpandedKeys.includes(key)) {
  //       newExpandedKeys.push(key)
  //     }
  //   }

  //   setExpandedKeys(newExpandedKeys)
  //   setAutoExpandParent(true)
  //   setLoadingSearch(false)
  // }



  useEffect(() => {
    // Use pre-generated tree if available, otherwise generate on demand
    if (preGeneratedTree && preGeneratedTree.length > 0) {
      setTree(preGeneratedTree)
    } else if (orgUnits && orgUnits.length > 0 && meOrgUnitId) {
      setTree(generateTreeFromOrgUnits(orgUnits, <CarryOutOutlined />, meOrgUnitId))
    }
  }, [preGeneratedTree, orgUnits, meOrgUnitId])

  return (
    <div>
      {
        tree.length === 0 && (
          <div className='d-flex justify-content-center align-items-center' style={{ padding: '20px' }}>
            <CircularLoader small />
            <span style={{ marginLeft: '10px' }}>Loading organisation units...</span>
          </div>
        )
      }
      {
        tree.length > 0 && (
          <>
            <div>
              <TreeSelect
                loading={loadingOrganisationUnits}
                showSearch
                style={{
                  width: '100%',
                }}
                dropdownStyle={{
                  maxHeight: 400,
                }}
                placeholder={loadingOrganisationUnits ? "Loading organisation units..." : "Select organisation unit"}
                allowClear
                disabled={loadingOrganisationUnits}
                value={currentOrgUnits?.length > 0 ? currentOrgUnits[0].id : null}
                onChange={value => setCurrentOrgUnits(orgUnits.filter(ou => ou.id === value))}
                treeData={tree}
                filterTreeNode={(inputValue, node) => {
                  if (inputValue?.trim()?.length > 0) {
                    return node?.title?.trim()?.toLowerCase()?.indexOf(inputValue?.trim()?.toLowerCase()) > -1
                  } else {
                    return true
                  }
                }}
              />
            </div>
          </>
        )}
    </div>
  )
}

export default OrganisationUnitsTree