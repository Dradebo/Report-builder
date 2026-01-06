import React, { useState, useEffect } from 'react'
import DesignsPage from './Components/DesignsPage'
import ReportsPage from './Components/ReportsPage'
import { ANALYTICS_ROUTE, ME_ROUTE, TEIS_ROUTE, ORGANISATION_UNIT_GROUP_ROUTE, USER_GROUPS_ROUTE, INDICATORS_METADATA_ROUTE } from './api.routes'
import { Button, CircularLoader }
    from '@dhis2/ui'
import Filter from './Components/Filter'
import { NOTIFICATON_CRITICAL, PAGE_DESIGN, PAGE_LEGEND, PAGE_REPORT, PAGE_SMS_CONFIG, YEAR } from './utils/constants'

import { cleanAggrateDimensionData, formatPeriodForAnalytic, getAggregateDimensionsList, getOrgUnitParentFromHtml, injectDataIntoHtml, inject_tei_into_html, loadDataStore, updateAndInjectOtherElementPeriod, updateAndInjectSchoolNames, extractPeriodOffsets, buildPeriodRangeForOffset, calculateEffectivePeriod, getComparisonDimensionsListWithOffsets, calculateOffsetPeriod } from './utils/fonctions'
import LegendPage from './Components/LegendPage'
import { NextUIProvider, Modal, Table } from '@nextui-org/react';
import SmsConfigPage from './Components/SmsConfigPage'
import MyNotification from './Components/MyNotification'
import { TbReportSearch } from 'react-icons/tb'
import { LuClipboardEdit } from 'react-icons/lu'
import { GrDocumentConfig } from 'react-icons/gr'
import { BiMessageDetail } from 'react-icons/bi'
import axios from 'axios'
import 'antd/dist/reset.css'
import './App.css'
console.log(ANALYTICS_ROUTE,"Afudee >>>>>")
const App = () => {
    const [notif, setNotif] = useState({ show: false, message: null, type: null })

    const [isDataStoreReportsCreated, setDataStoreReportsCreated] = useState(false)
    const [renderPage, setRenderPage] = useState(PAGE_REPORT)
    const [selectedReport, setSelectedReport] = useState(null)
    const [selectedReportContent, setSelectedReportContent] = useState(null)
    const [dataType, setDataType] = useState(null)
    const [dataValues, setDataValues] = useState([])
    const [orgUnits, setOrgUnits] = useState([])
    const [organisationUnitGroups, setOrganisationUnitGroups] = useState([])
    const [orgUnitLevels, setOrgUnitLevels] = useState([])
    const [_, setMaxLevel] = useState(null)
    const [minLevel, setMinLevel] = useState(null)
    const [meOrgUnitId, setMeOrgUnitId] = useState(null)
    const [reports, setReports] = useState([])
    const [legends, setLegends] = useState([])
    const [legendContents, setLegendContents] = useState([])
    const [smsConfigs, setSmsConfigs] = useState([])
    const [expandedKeys, setExpandedKeys] = useState([])
    const [currentOrgUnits, setCurrentOrgUnits] = useState([])
    const [selectedOrgUnits, setSelectedOrgUnits] = useState([])
    const [selectedProgram, setSelectedProgram] = useState(null)

    const [selectedPeriod, setSelectedPeriod] = useState(null)
    const [searchProperties, setSearchProperties] = useState([])

    const [loadingOrganisationUnits, setLoadingOrganisations] = useState(false)
    const [loadingGetDatas, setLoadingGetDatas] = useState(false)
    const [loadingSendDatas, setLoadingSendDatas] = useState(false)
    const [loadingDataStoreInitialization, setLoadingDataStoreInitialization] = useState(false)
    const [loadingSmsConfigs, setLoadingSmsConfigs] = useState(false)
    const [loadingReports, setLoadingReports] = useState(false)
    const [loadingLegendContents, setLoadingLegendContents] = useState(false)

    const [visibleListTei, setVisibleListTei] = useState(false)
    const [me, setMe] = useState(null)

    const [dataTypesFromHTML, setDataTypesFromHTML] = useState([])
    const [selectedDataTypeFromHTML, setSelectedDataTypeFromHTML] = useState(null)
    const [programTrackersFromHTML, setProgramTrackersFromHTML] = useState([])
    const [dataElementsFromHTML, setDataElementsFromHTML] = useState([])

    const [selectedProgramTrackerFromHTML, setSelectedProgramTrackerFromHTML] = useState(null)
    const [searchByAttribute, setSearchByAttribute] = useState(false)

    const [loadingQueryTeiList, setLoadingQueryTeiLIst] = useState(false)
    const [teis, setTeis] = useState([])
    const [selectedTEI, setSelectedTEI] = useState(null)

    const [selectedPeriodType, setSelectedPeriodType] = useState(YEAR)
    const [visiblePeriodComponent, setVisiblePeriodComponent] = useState(false)

    const [selectedPeriods, setSelectedPeriods] = useState([])
    const [appUserGroup, setAppUserGroup] = useState([])

    const initDataStore = async () => {
        try {
            setLoadingDataStoreInitialization(true)
            const legs = await loadDataStore(process.env.REACT_APP_LEGENDS_KEY, null, setLegends, [])
            loadDataStore(process.env.REACT_APP_REPORTS_KEY, setLoadingReports, setReports, [])
            loadDataStore(process.env.REACT_APP_SMS_CONFIG_KEY, setLoadingSmsConfigs, setSmsConfigs, [])

            await loadMe()
            loadOrganisationUnitGroups()

            setLoadingDataStoreInitialization(false)
            setDataStoreReportsCreated(true)
            loadLegendContents(legs)
        } catch (err) {
            setNotif({ show: true, message: err?.response?.data?.message || err.message, type: NOTIFICATON_CRITICAL })
            setDataStoreReportsCreated(false)
            setLoadingDataStoreInitialization(false)
        }
    }

    const initAppUserGroup = async () => {
        try {
            const existedGroup = await axios.get(`${USER_GROUPS_ROUTE}&fields=id&filter=name:eq:${process.env.REACT_APP_USER_GROUP}`)
            if (existedGroup.data.userGroups.length === 0) {
                await axios.post(`${USER_GROUPS_ROUTE}`, { name: process.env.REACT_APP_USER_GROUP })
                const createdUserGroup = await axios.get(`${USER_GROUPS_ROUTE}&fields=id&filter=name:eq:${process.env.REACT_APP_USER_GROUP}`)

                if (createdUserGroup.data.userGroups.length === 0) {
                    throw new Error("Impossible de créer le group utilisateur")
                }
                setAppUserGroup(createdUserGroup.data.userGroups[0])
            } else {
                setAppUserGroup(existedGroup.data.userGroups[0])
            }
        } catch (err) {
            setNotif({ show: true, message: err.response?.data?.message || err.message, type: NOTIFICATON_CRITICAL })
        }
    }

    const loadLegendContents = async (legendList) => {
        try {
            setLoadingLegendContents(true)

            if (legendList.length === 0) {
                setLoadingLegendContents(false)
                return
            }

            console.log(`[Report Builder] Loading ${legendList.length} legend contents`)

            // Use Promise.all to wait for all legends to load
            const legendPromises = legendList.map(leg =>
                loadDataStore(`LEGEND_${leg.id}`, null, null, {})
            )

            const loadedLegends = await Promise.all(legendPromises)

            console.log(`[Report Builder] Loaded ${loadedLegends.length} legend contents`)
            setLegendContents(loadedLegends)
            setLoadingLegendContents(false)

        } catch (err) {
            console.error('[Report Builder] Error loading legend contents:', err)
            setLoadingLegendContents(false)
            throw err
        }
    }

    const handleUpdateInformation = async () => {
        console.log('[Report Builder] ========== handleUpdateInformation START ==========')
        console.log('[Report Builder] selectedReportContent:', selectedReportContent)
        console.log('[Report Builder] selectedPeriod:', selectedPeriod)
        console.log('[Report Builder] selectedPeriodType:', selectedPeriodType)
        console.log('[Report Builder] currentOrgUnits:', currentOrgUnits)

        try {
            setLoadingGetDatas(true)
            setNotif({ show: false, message: null, type: null })

            console.log('[Report Builder] Getting org unit parents...')
            const corresponding_parents = getOrgUnitParentFromHtml(
                currentOrgUnits[0].id,
                orgUnits,
                orgUnitLevels
            )
            console.log('[Report Builder] Org unit parents:', corresponding_parents)

            console.log('[Report Builder] Extracting aggregate dimensions...')
            const dimensionList = getAggregateDimensionsList(selectedReportContent)
            console.log('[Report Builder] Aggregate dimensions:', dimensionList)

            console.log('[Report Builder] Extracting comparison dimensions...')
            const comparisonDimensions = getComparisonDimensionsListWithOffsets(selectedReportContent?.html || selectedReportContent)
            console.log(`[Report Builder] Found ${comparisonDimensions.length} comparison dimension references:`, comparisonDimensions)

            // Store indicator metadata for passing to legend functions
            let indicatorMetadata = {}

            // Accumulate all data values from all dimensions before injecting
            let allDataValues = []

            // Build dimension-period map for fetching
            const dimensionPeriodMap = new Map()

            if (dimensionList.length > 0 || comparisonDimensions.length > 0) {
                console.log(`[Report Builder] Fetching ${dimensionList.length} dimensions:`, dimensionList)

                // Step 1: Identify indicators and fetch their metadata to detect period offsets
                const indicators = dimensionList.filter(dim => !dim.includes('.')) // Indicators don't have dots (data elements have dots for COCs)
                console.log(`[Report Builder] Dimension list:`, dimensionList)
                console.log(`[Report Builder] Identified ${indicators.length} indicators:`, indicators)

                if (indicators.length > 0) {
                    try {
                        const metadataRoute = `${INDICATORS_METADATA_ROUTE}&filter=id:in:[${indicators.join(',')}]`
                        console.log(`[Report Builder] Fetching indicator metadata from: ${metadataRoute}`)

                        const metadataRequest = await fetch(metadataRoute)

                        // Check if response is ok
                        if (!metadataRequest.ok) {
                            throw new Error(`HTTP ${metadataRequest.status}: ${metadataRequest.statusText}`)
                        }

                        const metadataResponse = await metadataRequest.json()

                        // Check for DHIS2 API error response
                        if (metadataResponse.status === "ERROR") {
                            console.error('[Report Builder] DHIS2 API Error:', metadataResponse)
                            throw new Error(metadataResponse.message || 'DHIS2 API returned error status')
                        }

                        const offsetSummary = {
                            total: 0,
                            withOffsets: [],
                            withoutOffsets: 0
                        }

                        if (metadataResponse.indicators && metadataResponse.indicators.length > 0) {
                            offsetSummary.total = metadataResponse.indicators.length

                            metadataResponse.indicators.forEach(indicator => {
                                const numeratorOffsets = extractPeriodOffsets(indicator.numerator)
                                const denominatorOffsets = extractPeriodOffsets(indicator.denominator)
                                const allOffsets = [...new Set([...numeratorOffsets, ...denominatorOffsets])]

                                if (allOffsets.length > 0) {
                                    indicatorMetadata[indicator.id] = {
                                        offsets: allOffsets,
                                        name: indicator.name
                                    }
                                    offsetSummary.withOffsets.push({
                                        name: indicator.name,
                                        id: indicator.id,
                                        offsets: allOffsets
                                    })
                                } else {
                                    offsetSummary.withoutOffsets++
                                }
                            })
                        }

                        // Print summary
                        console.log(`\n${'='.repeat(80)}`)
                        console.log(`INDICATOR OFFSET DETECTION SUMMARY`)
                        console.log(`${'='.repeat(80)}`)
                        console.log(`Total indicators analyzed: ${offsetSummary.total}`)
                        console.log(`Indicators WITH period offsets: ${offsetSummary.withOffsets.length}`)
                        console.log(`Indicators WITHOUT period offsets: ${offsetSummary.withoutOffsets}`)

                        if (offsetSummary.withOffsets.length > 0) {
                            console.log(`\nIndicators with Period Offsets:`)
                            console.table(offsetSummary.withOffsets.map(ind => ({
                                'Indicator Name': ind.name,
                                'ID': ind.id,
                                'Offsets': JSON.stringify(ind.offsets)
                            })))
                        }
                        console.log(`${'='.repeat(80)}\n`)
                    } catch (err) {
                        console.error('[Report Builder] ✗ Failed to fetch indicator metadata:', err)
                        console.error('[Report Builder] Error details:', {
                            message: err.message,
                            stack: err.stack,
                            route: `${INDICATORS_METADATA_ROUTE}&filter=id:in:[${indicators.join(',')}]`,
                            indicatorCount: indicators.length,
                            indicators: indicators
                        })
                        console.warn('[Report Builder] ⚠ Proceeding without offset handling for indicators')

                        // Show user notification about indicator fetch failure
                        setNotif({
                            show: true,
                            message: `Failed to fetch indicator metadata: ${err.message}. Report may be incomplete.`,
                            type: NOTIFICATON_WARNING
                        })
                    }
                } else {
                    console.log(`[Report Builder] No indicators found in dimension list, skipping metadata fetch`)
                }

                // Step 2: Build dimension-period map
                console.log(`\n[Report Builder] Building dimension-period map...`)

                // Add standard dimensions to the map
                dimensionList.forEach(dim => {
                    if (!dimensionPeriodMap.has(dim)) {
                        dimensionPeriodMap.set(dim, new Set())
                    }

                    if (indicatorMetadata[dim]) {
                        // Legacy offset indicator - build period range
                        const periodString = buildPeriodRangeForOffset(
                            selectedPeriod,
                            selectedPeriodType,
                            indicatorMetadata[dim].offsets
                        )
                        periodString.split(';').forEach(p => dimensionPeriodMap.get(dim).add(p))
                    } else {
                        // Normal dimension - single period
                        const period = formatPeriodForAnalytic(selectedPeriod, selectedPeriodType)
                        dimensionPeriodMap.get(dim).add(period)
                    }
                })

                // Add comparison dimensions to the map
                comparisonDimensions.forEach(({ id, offset }) => {
                    if (!dimensionPeriodMap.has(id)) {
                        dimensionPeriodMap.set(id, new Set())
                    }
                    const offsetPeriod = calculateOffsetPeriod(selectedPeriod, selectedPeriodType, offset)
                    dimensionPeriodMap.get(id).add(offsetPeriod)
                })

                console.log(`[Report Builder] Dimension-period map built for ${dimensionPeriodMap.size} unique dimensions`)

                // Step 3: Fetch data for all dimension-period combinations in parallel
                console.log(`\n[Report Builder] Starting data fetch...`)

                const fetchSummary = {
                    dimensions: [],
                    totalValues: 0
                }

                const fetchPromises = Array.from(dimensionPeriodMap.entries()).map(async ([dim, periodsSet]) => {
                    try {
                        const periodString = Array.from(periodsSet).join(';')
                        const hasOffset = indicatorMetadata[dim] !== undefined
                        const isComparison = comparisonDimensions.some(cd => cd.id === dim)

                        console.log(`[Report Builder] Fetching ${dim}: periods [${periodString}]${hasOffset ? ' (legacy offset)' : ''}${isComparison ? ' (comparison)' : ''}`)

                        const route = ANALYTICS_ROUTE
                            .concat("?dimension=ou:")
                            .concat(corresponding_parents?.join(';'))
                            .concat("&dimension=dx:")
                            .concat(dim)
                            .concat("&dimension=pe:")
                            .concat(periodString)

                        const request = await fetch(route)
                        const response = await request.json()

                        if (response.status === "ERROR") {
                            console.error(`[Report Builder] Error for ${dim}:`, response)
                            throw response
                        }

                        // Track result for summary
                        const valueCount = response.dataValues ? response.dataValues.length : 0
                        fetchSummary.dimensions.push({
                            id: dim,
                            name: indicatorMetadata[dim]?.name || dim,
                            hasOffset,
                            isComparison,
                            periodString,
                            valueCount
                        })

                        return response.dataValues || []

                    } catch (err) {
                        console.error(`[Report Builder] ✗ Failed to fetch dimension ${dim}:`, err)
                        return []
                    }
                })

                // Wait for all fetches to complete and flatten results
                const fetchResults = await Promise.all(fetchPromises)
                allDataValues = fetchResults.flat()

                // Calculate total values
                fetchSummary.totalValues = allDataValues.length

                // Print data fetch summary
                console.log(`\n${'='.repeat(80)}`)
                console.log(`DATA FETCH SUMMARY`)
                console.log(`${'='.repeat(80)}`)
                console.log(`Total dimensions processed: ${fetchSummary.dimensions.length}`)
                console.log(`Total data values received: ${fetchSummary.totalValues}`)

                const withOffsets = fetchSummary.dimensions.filter(d => d.hasOffset)
                const comparisonDims = fetchSummary.dimensions.filter(d => d.isComparison && !d.hasOffset)
                const standardDims = fetchSummary.dimensions.filter(d => !d.hasOffset && !d.isComparison)

                if (withOffsets.length > 0) {
                    console.log(`\nLegacy Offset Indicators (${withOffsets.length}):`)
                    console.table(withOffsets.map(d => ({
                        'Dimension': d.name,
                        'ID': d.id,
                        'Period String': d.periodString,
                        'Values': d.valueCount
                    })))
                }

                if (comparisonDims.length > 0) {
                    console.log(`\nComparison Dimensions (${comparisonDims.length}):`)
                    console.table(comparisonDims.map(d => ({
                        'Dimension': d.name,
                        'ID': d.id,
                        'Period String': d.periodString,
                        'Values': d.valueCount
                    })))
                }

                if (standardDims.length > 0) {
                    console.log(`\nStandard Dimensions (${standardDims.length}):`)
                    const standardSummary = {}
                    standardDims.forEach(d => {
                        standardSummary[d.id] = d.valueCount
                    })
                    console.log(standardSummary)
                }
                console.log(`${'='.repeat(80)}\n`)

                // Now that we have indicator metadata, clean the dimension data with proper period context
                cleanAggrateDimensionData(selectedReportContent, dimensionList, selectedPeriod, selectedPeriodType, currentOrgUnits[0]?.id, orgUnits, orgUnitLevels, legendContents, organisationUnitGroups, indicatorMetadata)

                // Set state once with all accumulated data
                setDataValues(allDataValues)

                // Inject all data at once with complete dataset and indicator metadata
                if (allDataValues.length > 0) {
                    injectDataIntoHtml(allDataValues, selectedReportContent, orgUnits, orgUnitLevels, currentOrgUnits[0].id, selectedPeriod, selectedPeriodType, setNotif, legendContents, indicatorMetadata)
                } else {
                    console.warn('[Report Builder] No data values to inject')
                }
            } else {
                // No dimensions, but still need to clean
                cleanAggrateDimensionData(selectedReportContent, dimensionList, selectedPeriod, selectedPeriodType, currentOrgUnits[0]?.id, orgUnits, orgUnitLevels, legendContents, organisationUnitGroups, {})
            }

            handleUpdateOtherElement()
            setLoadingGetDatas(false)
        } catch (err) {
            console.error('[Report Builder] ========== ERROR in handleUpdateInformation ==========')
            console.error('[Report Builder] Error message:', err.message)
            console.error('[Report Builder] Error stack:', err.stack)
            console.error('[Report Builder] Full error object:', err)
            setLoadingGetDatas(false)
            setNotif({
                show: true,
                message: `Report generation failed: ${err.message}`,
                type: NOTIFICATON_CRITICAL
            })
        } finally {
            console.log('[Report Builder] ========== handleUpdateInformation END ==========')
        }
    }

    const handleUpdateOtherElement = () => {
        try {
            if (selectedReportContent) {
                updateAndInjectOtherElementPeriod(selectedReportContent, selectedPeriod, selectedPeriodType)
                updateAndInjectSchoolNames(selectedReportContent, currentOrgUnits[0].id, orgUnits, orgUnitLevels)
            }
        } catch (err) {
        }
    }

    const loadMe = async _ => {
        fetch(ME_ROUTE)
            .then(response => response.json())
            .then(response => {
                if (response.status === "ERROR")
                    throw response

                setMe(response)
            })
            .catch(err => {
            })
    }

    const loadOrganisationUnitGroups = async _ => {
        try {
            const request = await fetch(ORGANISATION_UNIT_GROUP_ROUTE.concat('&fields=id,name,displayName,organisationUnits'))

            const response = await request.json()

            if (response.status === "ERROR")
                throw response

            setOrganisationUnitGroups(response.organisationUnitGroups)
        } catch (error) {
            setNotif({ message: error.message, type: NOTIFICATON_CRITICAL, show: true })
        }
    }

    const handleDesignPage = () => {
        setRenderPage(PAGE_DESIGN)
    }

    const handleReportPage = _ => {
        setSelectedReportContent(null)
        setSelectedReport(null)
        setRenderPage(PAGE_REPORT)
    }

    const handleLegendPage = _ => {
        setRenderPage(PAGE_LEGEND)
    }

    const handleSmsConfigPage = _ => {
        setRenderPage(PAGE_SMS_CONFIG)
    }

    const generateTeiReport = (tei) => {
        inject_tei_into_html(selectedReportContent, tei, selectedProgramTrackerFromHTML, setNotif)
        setVisibleListTei(false)
        setSelectedTEI(tei)
    }

    const queryTeiList = async _ => {
        try {

            if (minLevel && selectedProgramTrackerFromHTML && currentOrgUnits.length > 0) {
                setLoadingQueryTeiLIst(true)

                if (currentOrgUnits.length === 0)
                    throw new Error("Organisation not selected")

                let route = TEIS_ROUTE.concat("?fields=orgUnit,trackedEntityInstance,attributes,enrollments[*]&ou=")
                    .concat(currentOrgUnits[0].id)
                    .concat('&')
                    .concat('ouMode=DESCENDANTS')
                    .concat('&')
                    .concat('program=' + selectedProgramTrackerFromHTML.id)

                if (searchProperties.length > 0) {
                    searchProperties.forEach(p => {
                        if (p.value && p.value?.trim() !== "") {
                            route = route.concat('&attribute='.concat(p.trackedEntityAttribute?.id).concat(':LIKE:' + p.value))
                        }
                    })
                }

                route = route.concat('&')
                    .concat('pageSize=10&page=1&pageSize=10&totalPages=false')

                const request = await fetch(route)
                const response = await request.json()
                if (response.status === "ERROR")
                    throw response


                handleUpdateOtherElement()
                setTeis(response.trackedEntityInstances)
                setLoadingQueryTeiLIst(false)
                setVisibleListTei(true)
            }
        } catch (err) {
            setLoadingQueryTeiLIst(false)
        }
    }

    const isAuthorised = () => {
        if (me) {
            if (me.authorities?.includes("ALL"))
                return true

            if (me.userGroups?.map(uGrp => uGrp.id)?.includes(appUserGroup?.id))
                return true
        }
        return false
    }

    const RenderContent = () => me && (
        <div className='row' style={{ width: '100%', minHeight: '95vh' }}>
            <div className='col-md-2' style={{ borderRight: '1px solid #ccc' }}>
                <div style={{ position: 'relative', height: '100%' }}>
                    <div className='py-2 px-3' style={{ position: 'sticky', top: '0px' }}>

                        {
                            isAuthorised() && (
                                <>
                                    <div onClick={() => handleReportPage()} style={{ display: 'flex', alignItems: 'center' }} className={'my-menu'.concat(renderPage === PAGE_REPORT ? ' current' : '')}>
                                        <span><TbReportSearch style={{ fontSize: '20px' }} /></span>
                                        <span style={{ marginLeft: '10px' }}>Reports</span>
                                    </div>
                                    <div onClick={() => handleDesignPage()} style={{ display: 'flex', alignItems: 'center' }} className={'my-menu'.concat(renderPage === PAGE_DESIGN ? ' current' : '')}>
                                        <span><LuClipboardEdit style={{ fontSize: '20px' }} /></span>
                                        <span style={{ marginLeft: '10px' }}>Design</span>
                                    </div>
                                    <div onClick={() => handleLegendPage()} style={{ display: 'flex', alignItems: 'center' }} className={'my-menu'.concat(renderPage === PAGE_LEGEND ? ' current' : '')}>
                                        <span><GrDocumentConfig style={{ fontSize: '20px' }} /></span>
                                        <span style={{ marginLeft: '10px' }}>Legend</span>
                                    </div>
                                    <div onClick={() => handleSmsConfigPage()} style={{ display: 'flex', alignItems: 'center' }} className={'my-menu'.concat(renderPage === PAGE_SMS_CONFIG ? ' current' : '')}>
                                        <span><BiMessageDetail style={{ fontSize: '20px' }} /></span>
                                        <span style={{ marginLeft: '10px' }}> SMS Config</span>
                                    </div>
                                    <hr className='text-black' />
                                </>
                            )}

                        <Filter
                            currentOrgUnits={currentOrgUnits}
                            dataType={dataType}
                            expandedKeys={expandedKeys}
                            handleUpdateInformation={handleUpdateInformation}
                            isDataStoreReportsCreated={isDataStoreReportsCreated}
                            loadingGetDatas={loadingGetDatas}
                            loadingOrganisationUnits={loadingOrganisationUnits}
                            meOrgUnitId={meOrgUnitId}
                            minLevel={minLevel}
                            orgUnits={orgUnits}
                            renderPage={renderPage}
                            selectedOrgUnits={selectedOrgUnits}
                            selectedPeriod={selectedPeriod}
                            selectedReport={selectedReport}
                            selectedReportContent={selectedReportContent}
                            setSelectedReportContent={setSelectedReportContent}
                            setCurrentOrgUnits={setCurrentOrgUnits}
                            setDataType={setDataType}
                            setExpandedKeys={setExpandedKeys}
                            setLoadingOrganisations={setLoadingOrganisations}
                            setMaxLevel={setMaxLevel}
                            setMeOrgUnitId={setMeOrgUnitId}
                            setMinLevel={setMinLevel}
                            setOrgUnitLevels={setOrgUnitLevels}
                            setOrgUnits={setOrgUnits}
                            setSelectedOrgUnits={setSelectedOrgUnits}
                            setSelectedPeriod={setSelectedPeriod}
                            setSelectedReport={setSelectedReport}
                            setSelectedProgram={setSelectedProgram}
                            selectedProgram={selectedProgram}
                            me={me}
                            setSelectedTEI={setSelectedTEI}
                            loadingLegendContents={loadingLegendContents}
                            searchProperties={searchProperties}
                            setSearchProperties={setSearchProperties}
                            dataTypesFromHTML={dataTypesFromHTML}
                            setDataTypesFromHTML={setDataTypesFromHTML}
                            selectedDataTypeFromHTML={selectedDataTypeFromHTML}
                            setSelectedDataTypeFromHTML={setSelectedDataTypeFromHTML}
                            programTrackersFromHTML={programTrackersFromHTML}
                            setProgramTrackersFromHTML={setProgramTrackersFromHTML}
                            selectedProgramTrackerFromHTML={selectedProgramTrackerFromHTML}
                            setSelectedProgramTrackerFromHTML={setSelectedProgramTrackerFromHTML}
                            searchByAttribute={searchByAttribute}
                            setSearchByAttribute={setSearchByAttribute}
                            queryTeiList={queryTeiList}
                            loadingQueryTeiList={loadingQueryTeiList}
                            dataElementsFromHTML={dataElementsFromHTML}
                            setDataElementsFromHTML={setDataElementsFromHTML}
                            reports={reports}
                            setVisiblePeriodComponent={setVisiblePeriodComponent}
                            setSelectedPeriodType={setSelectedPeriodType}
                            selectedPeriodType={selectedPeriodType}
                            visiblePeriodComponent={visiblePeriodComponent}
                            setSelectedPeriods={setSelectedPeriods}
                            legendContents={legendContents}
                            legends={legends}
                        />

                    </div>

                    <div style={{ position: 'absolute', bottom: 10, left: 0, textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '10px', color: '#00000050' }}>HWCA / version: {process.env.REACT_APP_VERSION}</div>
                    </div>


                </div>
            </div>
            <div className='col-md-10'>
                <div className='d-flex flex-column justify-content-center'>
                    {
                        renderPage === PAGE_REPORT && (
                            <ReportsPage
                                selectedReport={selectedReportContent}
                                dataValues={dataValues}
                                searchProperties={searchProperties}
                                minLevel={minLevel}
                                setSearchProperties={setSearchProperties}
                                generateTeiReport={generateTeiReport}
                                setVisibleListTei={setVisibleListTei}
                                visibleListTei={visibleListTei}
                                setLoadingSendDatas={setLoadingSendDatas}
                                loadingSendDatas={loadingSendDatas}
                                me={me}
                                searchByAttribute={searchByAttribute}
                                queryTeiList={queryTeiList}
                                selectedTEI={selectedTEI}
                                dataTypesFromHTML={dataTypesFromHTML}
                                currentOrgUnits={currentOrgUnits}
                                setNotif={setNotif}
                                smsConfigs={smsConfigs}
                                lengendContents={legendContents}
                                legends={legends}
                            />
                        )
                    }
                    {
                        renderPage === PAGE_DESIGN && me.authorities.includes('ALL') && (
                            <DesignsPage
                                loadingSendDatas={loadingSendDatas}
                                organisationUnitLevels={orgUnitLevels}
                                handleReportPage={handleReportPage}
                                setLoadingSendDatas={setLoadingSendDatas}
                                me={me}
                                organisationUnitGroups={organisationUnitGroups}
                                setNotif={setNotif}
                                reports={reports}
                                legends={legends}
                                setLoadingReports={setLoadingReports}
                                setReports={setReports}
                                loadingLegendContents={loadingLegendContents}
                                loadingReports={loadingReports}
                            />
                        )
                    }

                    {
                        renderPage === PAGE_LEGEND && me.authorities.includes('ALL') && (
                            <LegendPage
                                setLoadingSendDatas={setLoadingSendDatas}
                                me={me}
                                setNotif={setNotif}
                                legends={legends}
                                lengendContents={legendContents}
                                setLegendContentss={setLegendContents}
                                setLegends={setLegends}
                                loadingLegendContents={loadingLegendContents}
                                loadLegendContents={loadLegendContents}
                            />
                        )
                    }

                    {
                        renderPage === PAGE_SMS_CONFIG && me.authorities.includes('ALL') && (
                            <SmsConfigPage
                                setLoadingSendDatas={setLoadingSendDatas}
                                me={me}
                                setNotif={setNotif}
                                reports={reports}
                                legends={legends}
                                loadingSmsConfigs={loadingSmsConfigs}
                                setLoadingSmsConfigs={setLoadingSmsConfigs}
                                smsConfigs={smsConfigs}
                                setSmsConfigs={setSmsConfigs}
                            />
                        )
                    }
                </div>
            </div>
        </div>
    )

    const RenderListTeiModal = () => (
        <Modal
            scroll
            width="1300px"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            open={visibleListTei}
            onClose={() => setVisibleListTei(false)}
            closeButton
            blur
            preventClose
        >
            <Modal.Header>
                <div className='font-weight-bold fs-4'>
                    Tracked Entity instances
                </div>
            </Modal.Header>
            <Modal.Body>
                <div >
                    {teis.length === 0 && <div> NO DATA </div>}
                    {teis.length > 0 && selectedProgramTrackerFromHTML?.programTrackedEntityAttributes?.length > 0 && <Table
                        aria-label="Example table with static content"
                        css={{
                            height: "auto",
                            width: "100%",
                        }}
                        striped
                        sticked
                    >
                        <Table.Header>
                            {(selectedProgramTrackerFromHTML?.programTrackedEntityAttributes || []).map(att => (
                                <Table.Column key={att.id}>{att?.trackedEntityAttribute?.name}</Table.Column>
                            ))}
                            <Table.Column>Actions</Table.Column>
                        </Table.Header>
                        <Table.Body>
                            {teis.map((tei, index) => (
                                <Table.Row key={index}>
                                    {(selectedProgramTrackerFromHTML?.programTrackedEntityAttributes || []).map(programTrackedEntityAttribute => (
                                        <Table.Cell key={programTrackedEntityAttribute.trackedEntityAttribute.id}>
                                            {tei.attributes.find(attribute => attribute.attribute === programTrackedEntityAttribute.trackedEntityAttribute.id)?.value}
                                        </Table.Cell>
                                    ))}
                                    <Table.Cell>
                                        <Button primary small onClick={() => generateTeiReport(tei)} >report</Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>}

                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={() => setVisibleListTei(false)}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )

    useEffect(() => {
        initDataStore()
        initAppUserGroup()
    }, [])

    return (
        <NextUIProvider>
            <div style={{ minHeight: '95vh', backgroundColor: "#f3f3f3" }}>
                {
                    loadingDataStoreInitialization && (
                        <div className='d-flex align-items-center'>
                            <div> <CircularLoader small /> </div>
                            <div className='ml-3'> Loading configurations...</div>
                        </div>
                    )
                }
                {isDataStoreReportsCreated && me && RenderContent()}
                {RenderListTeiModal()}
                <MyNotification notification={notif} setNotification={setNotif} />
            </div>
        </NextUIProvider>
    )
}

export default App