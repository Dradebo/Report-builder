import { useMemo, useState, useEffect } from 'react'
import { CarryOutOutlined } from "@ant-design/icons"
import { TreeSelect } from "antd"
import { CircularLoader } from '@dhis2/ui'
import { generateTreeFromOrgUnits } from '../utils/fonctions'


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
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
    }, 200)

    return () => clearTimeout(timer)
  }, [searchValue])

  const normalizedSearchValue = useMemo(() => {
    return (debouncedSearchValue || '').trim().toLowerCase()
  }, [debouncedSearchValue])

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
                onSearch={value => setSearchValue(value)}
                treeData={tree}
                filterTreeNode={(inputValue, node) => {
                  if (!normalizedSearchValue) {
                    return true
                  }

                  const label = node?.searchLabel || ''
                  return label.includes(normalizedSearchValue)
                }}
              />
            </div>
          </>
        )}
    </div>
  )
}

export default OrganisationUnitsTree
