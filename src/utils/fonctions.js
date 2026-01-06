

import axios from "axios"
import dayjs from "dayjs"
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { TRACKER_ENTITY_INSTANCES_ROUTE, DATA_STORE_ROUTE } from "../api.routes"
import { ATTRIBUTE, COLOR, CURRENT, DATA_ELEMENT, DATE, DAY, ENROLLMENT, ENROLLMENT_DATE, IMAGE, INCIDENT_DATE, LABEL, MONTH, NOTIFICATON_WARNING, ORGANISATION_UNIT_NAME, OTHER_ELEMENT, QUARTERLY, SELECTED_DATE, TRACKER, WEEK, WEEKLY, YEAR } from "./constants"

// Extend dayjs with plugins
dayjs.extend(quarterOfYear)
dayjs.extend(weekOfYear)

const drawCamember = async (legendTypeId, attribute_code, value, period, setNotif, periodType, legendContentList) => {

  const current_legend_parent = legendContentList?.find(leg => leg.id === legendTypeId)
  const current_legend = findTheRightLegend(current_legend_parent, period, periodType)

  const current_html_element = document.getElementById(attribute_code)
  console.log("attribut code : ", attribute_code)

  console.log(current_html_element)

  if (current_legend && current_html_element) {

    let canvas = document.createElement('canvas')

    let canvas_parent = document.createElement('div')
    canvas_parent.setAttribute('style', "width:50px; height:50px;margin:0px auto;")

    canvas_parent.innerHTML = ""
    canvas_parent.append(canvas)

    current_html_element.innerHTML = ""
    current_html_element.append(canvas_parent)

    if (canvas) {
      const myChart = new Chart(canvas, {
        type: 'pie',
        data: {
          datasets: [{
            data: [parseInt(value), (100 - parseInt(value))],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)'
            ],
            borderColor: "#000",
            borderWidth: 1
          }
          ]
        }
      })
    }
  } else {
    injectFromId(attribute_code, value)
  }
}

const injectFromId = (id, value) => {
  const element = document.querySelectorAll('[id="' + id + '"]')
  if (element && element.length > 0) {
    element.forEach(current_el => {
      current_el.innerHTML = value
    })
  }
}

const defaultNotApplicableValueToApply = (attribute, item) => {

  if (item.defaultType === COLOR) {
    injectFromId(attribute, '<span style="color: ' + item.notApplicable + '; height:100%; width: 100%;"></span>')
  }

  if (item.defaultType === IMAGE) {
    injectFromId(attribute, "<img src='" + item.notApplicable + "' style='width: 40px; height:40px;' />")
  }

  if (item.defaultType === LABEL) {
    injectFromId(attribute, "<span>" + item.notApplicable + "</span>")
  }

}

const defaultMissingValueToApply = (attribute, item) => {
  try {

    if (item.defaultType === COLOR && item.missingData) {
      injectFromId(attribute, '<span style="color: ' + item.missingData + '; height:100%; width: 100%;"></span>')
    }

    if (item.defaultType === IMAGE && item.missingData) {
      injectFromId(attribute, "<img src='" + item.missingData + "' style='width: 40px; height:40px;' />")
    }

    if (item.defaultType === LABEL && item.missingData) {
      injectFromId(attribute, "<span>" + item.missingData + "</span>")
    }
  } catch (err) { }
}

const findTheRightLegend = (currentLegendParent, period, periodType) => {
  if (!currentLegendParent)
    return null

  let currentLegend = null
  const legendSetListKey = Object.keys(currentLegendParent?.periods)

  if (periodType === YEAR) {
    const legendWithNoEndDate = legendSetListKey.filter(l => l?.split('_')[1] ? false : true) || []
    const legendWithEndDate = legendSetListKey.filter(l => l?.split('_')[1] ? true : false) || []

    if (legendWithNoEndDate?.length > 0 && parseInt(dayjs(legendWithNoEndDate[0]).format('YYYY')) <= parseInt(dayjs(period).format('YYYY'))) {
      currentLegend = currentLegendParent?.periods[`${legendWithNoEndDate[0]}`]
    } else {

      const filteredLegend = legendWithEndDate.reduce((prev, current) => {
        const start = parseInt(dayjs(current.split('_')[0]).format('YYYY'))
        const end = parseInt(dayjs(current.split('_')[1]).format('YYYY'))
        const dateChoosed = parseInt(dayjs(period).format('YYYY'))

        if (start <= dateChoosed && dateChoosed <= end) {
          prev.push(current)
        }

        return prev
      }, [])

      currentLegend = currentLegendParent?.periods[`${filteredLegend[0]}`]
    }
  }

  if (periodType === MONTH) {
    const legendWithNoEndDate = legendSetListKey.filter(l => l?.split('_')[1] ? false : true) || []
    const legendWithEndDate = legendSetListKey.filter(l => l?.split('_')[1] ? true : false) || []

    if (legendWithNoEndDate?.length > 0 && (dayjs(legendWithNoEndDate[0]).startOf('month').isBefore(dayjs(period).startOf('month')) || dayjs(legendWithNoEndDate[0]).startOf('month').isSame(dayjs(period).startOf('month')))) {
      currentLegend = currentLegendParent?.periods[`${legendWithNoEndDate[0]}`]
    } else {

      const filteredLegend = legendWithEndDate.reduce((prev, current) => {
        const start = dayjs(current.split('_')[0]).startOf('month')
        const end = dayjs(current.split('_')[1]).endOf('month')
        const dateChoosed = dayjs(period).startOf('month')

        if ((dayjs(start).isBefore(dateChoosed) || dayjs(start).isSame(dateChoosed)) && (dayjs(dateChoosed).isBefore(end) || dayjs(dateChoosed).isSame(end))) {
          prev.push(current)
        }

        return prev
      }, [])

      currentLegend = currentLegendParent?.periods[`${filteredLegend[0]}`]
    }
  }

  if (periodType === DAY) {
    const legendWithNoEndDate = legendSetListKey.filter(l => l?.split('_')[1] ? false : true) || []
    const legendWithEndDate = legendSetListKey.filter(l => l?.split('_')[1] ? true : false) || []

    if (legendWithNoEndDate?.length > 0 && (dayjs(legendWithNoEndDate[0]).isBefore(dayjs(period)) || dayjs(legendWithNoEndDate[0]).isSame(dayjs(period)))) {
      currentLegend = currentLegendParent?.periods[`${legendWithNoEndDate[0]}`]
    } else {

      const filteredLegend = legendWithEndDate.reduce((prev, current) => {
        const start = dayjs(current.split('_')[0])
        const end = dayjs(current.split('_')[1])
        const dateChoosed = dayjs(period)

        if ((dayjs(start).isBefore(dateChoosed) || dayjs(start).isSame(dateChoosed)) && (dayjs(dateChoosed).isBefore(end) || dayjs(dateChoosed).isSame(end))) {
          prev.push(current)
        }

        return prev
      }, [])

      currentLegend = currentLegendParent?.periods[`${filteredLegend[0]}`]
    }
  }

  return currentLegend
}

const displayNotificationIfLegendIsNotSet = (setNotif, legendName, period) => {
  setNotif({ show: true, message: `Some legends have not been configured for the selected period ( ${dayjs(period).format('YYYY')} ) , the values ​​will be displayed instead of these legends ! `, type: NOTIFICATON_WARNING })
}

const checkLabelLegend = async (legendTypeId, attribute_code, value, period, setNotif, periodType, legendContentList) => {
  const current_legend_parent = legendContentList?.find(leg => leg.id === legendTypeId)
  const current_legend = findTheRightLegend(current_legend_parent, period, periodType)

  if (current_legend && current_legend.items?.length > 0) {
    for (let item of current_legend.items) {
      if (parseFloat(parseFloat(value).toFixed(4)) >= parseFloat(parseFloat(item.start).toFixed(4)) && parseFloat(parseFloat(value).toFixed(4)) < parseFloat(parseFloat(item.end).toFixed(4))) {
        injectFromId(attribute_code, '<span>' + item.name + '</span>')
      }

      if (parseFloat(parseFloat(value).toFixed(4)) >= parseFloat(parseFloat(item.start).toFixed(4)) && parseFloat(parseFloat(value).toFixed(4)) === parseFloat(parseFloat(item.end).toFixed(4))) {
        injectFromId(attribute_code, '<span>' + item.name + '</span>')
      }
    }

  } else {
    injectFromId(attribute_code, value)
    displayNotificationIfLegendIsNotSet(setNotif, current_legend_parent?.name, period)
  }
}

const checkColorLegend = async (legendTypeId, attribute_code, value, period, setNotif, periodType, legendContentList) => {
  const current_legend_parent = legendContentList?.find(leg => leg.id === legendTypeId)

  const current_legend = findTheRightLegend(current_legend_parent, period, periodType)


  if (current_legend && current_legend.items?.length > 0) {
    for (let item of current_legend.items) {

      if (!item.color) {
        injectFromId(attribute_code, value)
        return setNotif({
          show: true,
          message: `You try to display some colors that have not been configurated for the selected period ( ${dayjs(period).format('YYYY')} ) , the values ​​will be displayed instead of these legends ! `,
          type: NOTIFICATON_WARNING
        })
      }


      if (parseFloat(parseFloat(value).toFixed(4)) >= parseFloat(parseFloat(item.start).toFixed(4)) && parseFloat(parseFloat(value).toFixed(4)) < parseFloat(parseFloat(item.end).toFixed(4))) {
        const element = document.querySelector('[id="' + attribute_code + '"]')
        if (element) {
          element.innerHTML = '<span style="font-weight: bold;">' + value + '</span>'
          element.style.background = item.color
          element.style.color = '#ffffff'
          element.style.textAlign = 'center'
        }
      }

      if (parseFloat(parseFloat(value).toFixed(4)) >= parseFloat(parseFloat(item.start).toFixed(4)) && parseFloat(parseFloat(value).toFixed(4)) === parseFloat(parseFloat(item.end).toFixed(4))) {
        const element = document.querySelector('[id="' + attribute_code + '"]')
        if (element) {
          element.innerHTML = '<span style="font-weight: bold;">' + value + '</span>'
          element.style.background = item.color
          element.style.color = '#ffffff'
          element.style.textAlign = 'center'
        }
      }
    }

  } else {
    injectFromId(attribute_code, value)
    displayNotificationIfLegendIsNotSet(setNotif, current_legend_parent?.name, period)
  }
}

const checkImageLegend = async (legendTypeId, attribute_code, value, period, setNotif, periodType, legendContentList) => {

  const current_legend_parent = legendContentList?.find(leg => leg.id === legendTypeId)
  const current_legend = findTheRightLegend(current_legend_parent, period, periodType)

  if (current_legend && current_legend.items?.length > 0) {
    for (let item of current_legend.items) {
      if (!item.image) {
        injectFromId(attribute_code, value)
        return setNotif({
          show: true,
          message: `You try to display some images that have not been configurated for the selected period ( ${dayjs(period).format('YYYY')} ) , the values ​​will be displayed instead of these legends ! `,
          type: NOTIFICATON_WARNING

        })
      }

      if (parseFloat(parseFloat(value).toFixed(4)) >= parseFloat(parseFloat(item.start).toFixed(4)) && parseFloat(parseFloat(value).toFixed(4)) < parseFloat(parseFloat(item.end).toFixed(4))) {
        injectFromId(attribute_code, "<img src='" + item.image + "' style='width: 40px; height:40px;' />")
      }

      if (parseFloat(parseFloat(value).toFixed(4)) >= parseFloat(parseFloat(item.start).toFixed(4)) && parseFloat(parseFloat(value).toFixed(4)) === parseFloat(parseFloat(item.end).toFixed(4))) {
        injectFromId(attribute_code, "<img src='" + item.image + "' style='width: 40px; height:40px;' />")
      }
    }
  } else {
    injectFromId(attribute_code, value)
    displayNotificationIfLegendIsNotSet(setNotif, current_legend_parent?.name, period)
  }
}

const inject_legend = (legendType, legendId, attribute_code, value, period, setNotif, periodType, legendContentList) => {
  if (legendType && legendId && attribute_code && value && period) {
    switch (legendType) {
      case "color":
        checkColorLegend(legendId, attribute_code, value, period, setNotif, periodType, legendContentList)
        break

      case "label":
        checkLabelLegend(legendId, attribute_code, value, period, setNotif, periodType, legendContentList)
        break

      case "image":
        checkImageLegend(legendId, attribute_code, value, period, setNotif, periodType, legendContentList)
        break

      case "pie":
        drawCamember(legendId, attribute_code, value, html_id_code, period, setNotif, periodType, legendContentList)
        break

      default:
        break
    }
  }
}

export const inject_tei_into_html = (report, current_tei, selectedProgramTrackerFromHTML, setNotif) => {

  if (!selectedProgramTrackerFromHTML)
    return null

  if (!current_tei)
    return null

  let my_container = document.querySelector('[id="my-table-container"]')
  const report_html_cloned = report.html


  let parser = new DOMParser()
  const report_html_cloned_document = parser.parseFromString(report_html_cloned, 'text/html')


  let program_tracker_list = report_html_cloned_document.querySelectorAll('[data-type=' + TRACKER.value + '][id*="' + selectedProgramTrackerFromHTML.id + '"]')

  /*  Néttoyage du contenu */
  for (let program_tracker of program_tracker_list) {
    program_tracker.innerHTML = ""
    const get_id = program_tracker.getAttribute("id")
    my_container.querySelector("[id='" + get_id + "']").innerHTML = ""
  }

  // Insertion des données
  for (let program_tracker of program_tracker_list) {

    const get_id = program_tracker.getAttribute("id")
    const get_data_is = program_tracker.getAttribute("data-is")
    const get_data_has_legend = program_tracker.getAttribute("data-has-legend")


    // Interprétation des données sur les attributes
    if (get_data_is === ATTRIBUTE) {
      if (get_id) {
        const get_attribute_id = get_id.split('|')?.[1]
        const attribute_found = current_tei.attributes?.find(at => at.attribute === get_attribute_id)
        const html_el = my_container.querySelector("[id='" + get_id + "']")

        if (attribute_found && html_el) {
          if (!get_data_has_legend || get_data_has_legend === "NO") {
            if (attribute_found.valueType === IMAGE) {
              if (attribute_found.value) {
                html_el.innerHTML = `<img
                style="width: 200px;height:200px;object-fit: cover;"
                src="${TRACKER_ENTITY_INSTANCES_ROUTE
                    .concat('/')
                    .concat(current_tei.trackedEntityInstance)
                    .concat('/')
                    .concat(get_attribute_id)
                    .concat('/image')
                  }"
              />`
              } else {
                html_el.innerHTML = `<img style="width: 200px; height: 200px;object-fit: cover;" src="${STUDENT_IMAGE}" />`
              }
            } else {
              html_el.innerHTML = attribute_found.value
            }
          }
        }

        if (get_data_has_legend === "YES") {
          const get_legend_type = get_id.split("|")?.[3]
          const get_legend_ID = get_id.split("|")?.[2]

          if (get_legend_ID && get_legend_type) {
            inject_legend(get_legend_type, get_legend_ID, get_id, attribute_found.value, setNotif)
          }
        }

      }
    }

    // Interprétation des données sur certaines informations d'enrollment
    if (get_data_is === ENROLLMENT) {
      if (get_id) {
        const get_enrollment_html_id = get_id?.split('|')?.[1]

        if (get_enrollment_html_id === ENROLLMENT_DATE) {
          const html_el = my_container.querySelector("[id='" + get_id + "']")
          html_el.innerHTML = current_tei.enrollments?.[0]?.enrollmentDate ? dayjs(current_tei.enrollments?.[0]?.enrollmentDate).format("YYYY-MM-DD") : ""
        }


        if (get_enrollment_html_id === INCIDENT_DATE) {
          const html_el = my_container.querySelector("[id='" + get_id + "']")
          html_el.innerHTML = current_tei.enrollments?.[0]?.incidentDate ? dayjs(current_tei.enrollments?.[0]?.incidentDate).format("YYYY-MM-DD") : ""
        }


        if (get_enrollment_html_id === ORGANISATION_UNIT_NAME) {
          const html_el = my_container.querySelector("[id='" + get_id + "']")
          html_el.innerHTML = current_tei.enrollments?.[0]?.orgUnitName || ""
        }
      }
    }

    // Interprétation des données sur les dataElements
    if (get_data_is === DATA_ELEMENT) {
      if (get_id) {

        const get_program_id = get_id.split('|')?.[0]
        const get_programStage_id = get_id.split('|')?.[1]
        const get_dataElement_id = get_id.split('|')?.[2]

        const html_el = my_container.querySelector("[id='" + get_id + "']")


        if (get_data_has_legend === "NO") {
          let found_element = null
          const actuel_event = current_tei?.enrollments[0]?.events?.filter(ev => ev.programStage === get_programStage_id)?.[0]


          if (actuel_event && actuel_event?.dataValues?.length > 0 && get_programStage_id === actuel_event?.programStage && get_program_id === selectedProgramTrackerFromHTML?.id) {

            found_element = actuel_event.dataValues.find(dv => dv.dataElement === get_dataElement_id)
          }

          if (found_element) {
            html_el.innerHTML = found_element.value
          }
        }

      }
    }
  }
}

export const injectDataIntoHtml = (dataValues, { html }, orgUnits, levels, selectedOrgUnit, period, periodType, setNotif, legendContentList, indicatorMetadata = {}) => {
  if (selectedOrgUnit) {
    let my_container = document.querySelector('[id="my-table-container"]')

    // Track matched and unmatched data for debugging
    const matchedDataValues = new Set()
    const html_elements_list = my_container.querySelectorAll('[data-type="AGGREGATE"]')

    for (let html_el of html_elements_list) {
      const html_ID = html_el.getAttribute('id')
      const data_has_legend = html_el.getAttribute('data-has-legend')

      // If no legend
      if (data_has_legend === 'NO' && html_ID) {

        const dx_id = html_ID.split('|')?.[0]
        const ou_id = html_ID.split('|')?.[1]

        if (dx_id && ou_id) {
          // Filter data values by period if this indicator has offsets
          let relevantDataValues = dataValues

          if (indicatorMetadata[dx_id]) {
            const userSelectedPeriodFormatted = formatPeriodForAnalytic(period, periodType)
            relevantDataValues = dataValues.filter(dv => {
              const dataElement = dv.dataElement
              const el = dv.categoryOptionCombo ? dataElement + "." + dv.categoryOptionCombo : dataElement
              if (el === dx_id) {
                return dv.period === userSelectedPeriodFormatted
              }
              return true
            })
          }

          for (let dataValue of relevantDataValues) {
            const dataElement = dataValue.dataElement
            const orgUnit = dataValue.orgUnit
            const value = dataValue.value

            const el = dataValue.categoryOptionCombo ? dataElement + "." + dataValue.categoryOptionCombo : dataElement

            if (
              el === dx_id &&
              orgUnit === getOrgUnitIdFromParentString(ou_id, selectedOrgUnit, orgUnits, levels)?.id
            ) {

              html_el.innerHTML = ""

              injectFromId(html_ID, value)

              // Track this data value as matched
              matchedDataValues.add(`${el}|${orgUnit}`)

            }
          }
        }
      }

      if (data_has_legend === "YES" && html_ID) {

        const dx_id = html_ID.split('|')?.[0]
        const ou_id = html_ID.split('|')?.[1]
        const legend_id = html_ID.split('|')?.[2]
        const legend_type = html_ID.split('|')?.[3]

        if (dx_id && ou_id && legend_id && legend_type) {
          // Filter data values by period if this indicator has offsets
          let relevantDataValues = dataValues

          if (indicatorMetadata[dx_id]) {
            // This indicator has period offsets - we need to filter to only the user-selected period
            // The Analytics API returned data for MULTIPLE periods (e.g., Dec 2023 + Jan 2024)
            // But we only want to display the data for the user-selected period (e.g., Jan 2024)
            const userSelectedPeriodFormatted = formatPeriodForAnalytic(period, periodType)

            relevantDataValues = dataValues.filter(dv => {
              const dataElement = dv.dataElement
              const el = dv.categoryOptionCombo ? dataElement + "." + dv.categoryOptionCombo : dataElement

              // Only filter if this is the dimension we're currently processing
              if (el === dx_id) {
                const matches = dv.period === userSelectedPeriodFormatted
                if (!matches) {
                  console.log(`[Report Builder] Filtering out ${el} data from period ${dv.period} (want ${userSelectedPeriodFormatted})`)
                }
                return matches
              }
              return true // Keep other dimensions as-is
            })

            console.log(`[Report Builder] Indicator ${dx_id} with offsets: filtered ${dataValues.length} -> ${relevantDataValues.length} data values`)
          }

          for (let dataValue of relevantDataValues) {

            const dataElement = dataValue.dataElement
            const orgUnit = dataValue.orgUnit
            const value = dataValue.value
            const el = dataValue.categoryOptionCombo ? dataElement + "." + dataValue.categoryOptionCombo : dataElement

            if (
              el === dx_id &&
              orgUnit === getOrgUnitIdFromParentString(ou_id, selectedOrgUnit, orgUnits, levels)?.id
            ) {

              // Calculate effective period for legend matching
              // If this is an indicator with offset, use the offset period for legend selection
              let effectivePeriod = period
              if (indicatorMetadata[dx_id]) {
                // Use the most negative offset (earliest period) for legend matching
                // This matches the actual calculation period for the indicator
                const minOffset = Math.min(...indicatorMetadata[dx_id].offsets)
                effectivePeriod = calculateEffectivePeriod(period, periodType, minOffset)
                console.log(`[Report Builder] ${dx_id}: Using data from ${formatPeriodForAnalytic(period, periodType)} with legend from ${formatPeriodForAnalytic(effectivePeriod, periodType)} (offset: ${minOffset})`)
              }

              switch (legend_type) {
                case "color":
                  checkColorLegend(legend_id, html_ID, value, effectivePeriod, setNotif, periodType, legendContentList)
                  break

                case "label":
                  checkLabelLegend(legend_id, html_ID, value, effectivePeriod, setNotif, periodType, legendContentList)
                  break

                case "image":
                  checkImageLegend(legend_id, html_ID, value, effectivePeriod, setNotif, periodType, legendContentList)
                  break

                case "pie":
                  drawCamember(legend_id, html_ID, value, effectivePeriod, setNotif, periodType, legendContentList)
                  break

                default:
                  break
              }

              // Track this data value as matched
              matchedDataValues.add(`${el}|${orgUnit}`)

            }
          }


        }

      }

    }

    // Process comparison elements
    const comparison_elements_list = my_container.querySelectorAll('[data-type="AGGREGATE_COMPARISON"]')
    console.log(`[Report Builder] Processing ${comparison_elements_list.length} comparison elements`)

    for (let compEl of comparison_elements_list) {
      const html_ID = compEl.getAttribute('id')
      const primaryId = compEl.getAttribute('data-primary-id')
      const primaryOffset = parseInt(compEl.getAttribute('data-primary-offset') || '0')
      const comparisonId = compEl.getAttribute('data-comparison-id')
      const comparisonOffset = parseInt(compEl.getAttribute('data-comparison-offset') || '0')
      const comparisonMode = compEl.getAttribute('data-comparison-mode') || 'SIMPLE'
      const ouLevel = compEl.getAttribute('data-ou-level')

      if (!primaryId || !comparisonId) continue

      // Resolve org unit
      const resolvedOrgUnit = getOrgUnitIdFromParentString(
        ouLevel,
        selectedOrgUnit,
        orgUnits,
        levels
      )

      if (!resolvedOrgUnit) continue

      // Calculate effective periods for both indicators
      const primaryPeriod = calculateOffsetPeriod(period, periodType, primaryOffset)
      const comparisonPeriod = calculateOffsetPeriod(period, periodType, comparisonOffset)

      // Find data values for both indicators at their respective periods
      const primaryData = dataValues.find(dv => {
        const el = dv.categoryOptionCombo ? `${dv.dataElement}.${dv.categoryOptionCombo}` : dv.dataElement
        return el === primaryId && dv.orgUnit === resolvedOrgUnit.id && dv.period === primaryPeriod
      })

      const comparisonData = dataValues.find(dv => {
        const el = dv.categoryOptionCombo ? `${dv.dataElement}.${dv.categoryOptionCombo}` : dv.dataElement
        return el === comparisonId && dv.orgUnit === resolvedOrgUnit.id && dv.period === comparisonPeriod
      })

      console.log(`[Report Builder] Comparison ${primaryId} (${primaryPeriod}) vs ${comparisonId} (${comparisonPeriod}):`, {
        primaryValue: primaryData?.value,
        comparisonValue: comparisonData?.value,
        mode: comparisonMode
      })

      // Track matched data
      if (primaryData) {
        const primaryEl = primaryData.categoryOptionCombo ? `${primaryData.dataElement}.${primaryData.categoryOptionCombo}` : primaryData.dataElement
        matchedDataValues.add(`${primaryEl}|${primaryData.orgUnit}`)
      }
      if (comparisonData) {
        const comparisonEl = comparisonData.categoryOptionCombo ? `${comparisonData.dataElement}.${comparisonData.categoryOptionCombo}` : comparisonData.dataElement
        matchedDataValues.add(`${comparisonEl}|${comparisonData.orgUnit}`)
      }

      // Process based on comparison mode
      if (comparisonMode === 'CONDITIONAL') {
        // CONDITIONAL mode: evaluate conditions and apply matched legend
        const conditionsJson = compEl.getAttribute('data-conditions')
        if (!conditionsJson) {
          console.warn('[Report Builder] CONDITIONAL mode but no conditions data attribute found')
          compEl.innerHTML = 'N/A'
          continue
        }

        let conditions
        try {
          // Decode HTML entities that jQuery attr() automatically encodes
          const decoded = conditionsJson
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')  // Must be last to avoid double-decoding

          conditions = JSON.parse(decoded)
        } catch (error) {
          console.error('[Report Builder] Failed to parse conditions JSON:', error)
          console.error('[Report Builder] Raw conditionsJson:', conditionsJson)
          console.error('[Report Builder] Decoded value:', decoded)
          compEl.innerHTML = 'N/A'
          continue
        }

        // Evaluate conditional comparison
        const { compareIndicators, evaluateConditionalComparison } = require('./comparisonFunctions')
        const mappedValue = evaluateConditionalComparison(
          primaryData?.value,
          comparisonData?.value,
          conditions
        )

        if (mappedValue === null) {
          compEl.innerHTML = 'N/A'
          continue
        }

        // Get shared legend for all condition branches
        const legendId = compEl.getAttribute('data-legend-id')
        const legendType = compEl.getAttribute('data-legend-type')

        if (legendId && legendType) {
          // Apply shared legend with mapped value
          console.log(`[Report Builder] Applying conditional legend: ${legendId} (type: ${legendType}, value: ${mappedValue})`)

          switch (legendType) {
            case "color":
              checkColorLegend(legendId, html_ID, mappedValue, period, setNotif, periodType, legendContentList)
              break

            case "label":
              checkLabelLegend(legendId, html_ID, mappedValue, period, setNotif, periodType, legendContentList)
              break

            case "image":
              checkImageLegend(legendId, html_ID, mappedValue, period, setNotif, periodType, legendContentList)
              break

            case "pie":
              drawCamember(legendId, html_ID, mappedValue, period, setNotif, periodType, legendContentList)
              break

            default:
              compEl.innerHTML = mappedValue.toFixed(2)
              break
          }
        } else {
          // No legend, display raw mapped value
          compEl.innerHTML = mappedValue.toFixed(2)
        }

      } else {
        // SIMPLE mode: existing logic
        const operator = compEl.getAttribute('data-comparison-operator')
        const hasLegend = compEl.getAttribute('data-has-legend')
        const legendId = compEl.getAttribute('data-legend-id')
        const legendType = compEl.getAttribute('data-legend-type')

        // Perform comparison
        const { compareIndicators, formatComparisonResult } = require('./comparisonFunctions')
        const result = compareIndicators(
          primaryData?.value,
          comparisonData?.value,
          operator
        )

        // Apply legend or raw value
        if (hasLegend === "YES" && result !== null && legendId && legendType) {
          // Apply legend transformation
          switch (legendType) {
            case "color":
              checkColorLegend(legendId, html_ID, result, period, setNotif, periodType, legendContentList)
              break

            case "label":
              checkLabelLegend(legendId, html_ID, result, period, setNotif, periodType, legendContentList)
              break

            case "image":
              checkImageLegend(legendId, html_ID, result, period, setNotif, periodType, legendContentList)
              break

            case "pie":
              drawCamember(legendId, html_ID, result, period, setNotif, periodType, legendContentList)
              break

            default:
              compEl.innerHTML = formatComparisonResult(result, operator)
              break
          }
        } else {
          // Raw value display
          compEl.innerHTML = formatComparisonResult(result, operator)
        }
      }
    }

    // Log unmatched data values for debugging
    const unmatchedDataValues = dataValues.filter(dv => {
      const el = dv.categoryOptionCombo ? `${dv.dataElement}.${dv.categoryOptionCombo}` : dv.dataElement
      return !matchedDataValues.has(`${el}|${dv.orgUnit}`)
    })

    // Print legend injection summary
    console.log(`\n${'='.repeat(80)}`)
    console.log(`LEGEND INJECTION SUMMARY`)
    console.log(`${'='.repeat(80)}`)
    console.log(`Total data values received: ${dataValues.length}`)
    console.log(`Successfully matched to DOM: ${matchedDataValues.size}`)
    console.log(`Failed to match: ${unmatchedDataValues.length}`)

    // Show indicators with period offsets that were filtered
    const offsetIndicators = Object.keys(indicatorMetadata)
    if (offsetIndicators.length > 0) {
      console.log(`\nIndicators with Period Offsets (period filtering applied):`)
      offsetIndicators.forEach(id => {
        const meta = indicatorMetadata[id]
        const minOffset = Math.min(...meta.offsets)
        const effectivePeriod = calculateEffectivePeriod(period, periodType, minOffset)
        console.log(`  - ${meta.name} (${id}):`)
        console.log(`    Data period: ${formatPeriodForAnalytic(period, periodType)}`)
        console.log(`    Legend period: ${formatPeriodForAnalytic(effectivePeriod, periodType)} (offset: ${minOffset})`)
      })
    }

    if (unmatchedDataValues.length > 0) {
      console.log(`\nUnmatched Data Values:`)
      unmatchedDataValues.forEach((dv, idx) => {
        if (idx < 10) { // Log first 10 to avoid console spam
          const el = dv.categoryOptionCombo ? `${dv.dataElement}.${dv.categoryOptionCombo}` : dv.dataElement
          console.log(`  - ${el} | ${dv.orgUnit} | period ${dv.period} = ${dv.value}`)
        }
      })
      if (unmatchedDataValues.length > 10) {
        console.log(`  ... and ${unmatchedDataValues.length - 10} more`)
      }
    }
    console.log(`${'='.repeat(80)}\n`)
  }

}

export const generateTreeFromOrgUnits = (ouList = [], icon = null, parentId = null, level = 1, setLoading) => {
  // Don't set loading here - org units are already loaded at app startup
  const orgUnits = ouList.map(o => ({
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
  }))

  const nodeMap = new Map()
  orgUnits.forEach(node => nodeMap.set(node.id, node))

  orgUnits.forEach(node => {
    if (node.parent && nodeMap.has(node.parent)) {
      nodeMap.get(node.parent).children.push(node)
    }
  })

  const nodes = parentId
    ? (nodeMap.has(parentId) ? [nodeMap.get(parentId)] : [])
    : orgUnits.filter(node => node.level === level)

  setLoading && setLoading(false)

  return nodes
}

export const getOrgUnitIdFromParentString = (parent_string, selectedOU, orgUnits, orgUnitLevels) => {
  if (!parent_string) {
    return null
  }

  // Handle direct "CURRENT" reference
  if (parent_string === CURRENT) {
    const current = orgUnits.find(ou => ou.id === selectedOU)
    if (!current) {
      console.warn(`[Report Builder] Selected org unit ${selectedOU} not found in orgUnits list`)
    }
    return current
  }

  // Handle "PARENT_X" pattern
  if (!orgUnitLevels || orgUnitLevels.length === 0) {
    console.warn('[Report Builder] orgUnitLevels is empty, cannot resolve parent string:', parent_string)
    return null
  }

  const selectedOu_object = orgUnits.find(ou => ou.id === selectedOU)
  if (!selectedOu_object) {
    console.warn(`[Report Builder] Selected org unit ${selectedOU} not found`)
    return null
  }

  // Parse parent index (e.g., "PARENT_1" -> 1)
  const parent_string_index = parseInt(parent_string.split('_')?.[1])
  if (isNaN(parent_string_index)) {
    console.warn(`[Report Builder] Invalid parent string format: ${parent_string}`)
    return null
  }

  // Calculate parent level
  const corresponding_parent_level = selectedOu_object.level - parent_string_index
  if (corresponding_parent_level <= 0) {
    // Requesting parent beyond root level
    return null
  }

  // Find parent in org unit path
  if (!selectedOu_object.path) {
    console.warn(`[Report Builder] Selected org unit ${selectedOU} has no path`)
    return null
  }

  const selectedOu_parent_path_list = selectedOu_object.path.split('/').filter(Boolean)
  const new_selectOU_parent_path_list = []

  for (let path_id of selectedOu_parent_path_list) {
    const newObject = orgUnits.find(ou => ou.id === path_id)
    if (newObject) {
      new_selectOU_parent_path_list.push(newObject)
    }
  }

  const parent_found = new_selectOU_parent_path_list.find(ou => ou.level === corresponding_parent_level)
  if (!parent_found) {
    console.warn(`[Report Builder] No parent found at level ${corresponding_parent_level} for org unit ${selectedOU} (${selectedOu_object.name})`)
  }

  return parent_found || null
}

export const getOrgUnitParentFromHtml = (selectedOU, orgUnits, orgUnitLevels) => {
  let uid_list = []
  const container = document.querySelector('[id="my-table-container"]')

  // Get both regular aggregate elements and comparison elements
  const aggregateElements = container?.querySelectorAll("[data-type='AGGREGATE']") || []
  const comparisonElements = container?.querySelectorAll("[data-type='AGGREGATE_COMPARISON']") || []

  // Process regular aggregate elements
  if (aggregateElements && aggregateElements.length > 0) {
    for (let id_html of aggregateElements) {
      const id_string = id_html.getAttribute('id')
      if (id_string) {
        const orgUnit_parent_name = id_string.split('|')?.[1]
        if (orgUnit_parent_name) {
          const parent_object = getOrgUnitIdFromParentString(orgUnit_parent_name, selectedOU, orgUnits, orgUnitLevels)
          if (parent_object) {
            if (!uid_list.includes(parent_object.id)) {
              uid_list.push(parent_object.id)
            }
          }
        }
      }
    }
  }

  // Process comparison elements
  if (comparisonElements && comparisonElements.length > 0) {
    for (let compEl of comparisonElements) {
      const ouLevel = compEl.getAttribute('data-ou-level')
      if (ouLevel) {
        const parent_object = getOrgUnitIdFromParentString(ouLevel, selectedOU, orgUnits, orgUnitLevels)
        if (parent_object) {
          if (!uid_list.includes(parent_object.id)) {
            uid_list.push(parent_object.id)
          }
        }
      }
    }
  }

  console.log(`[Report Builder] Extracted ${uid_list.length} org unit IDs from HTML (${aggregateElements.length} aggregate + ${comparisonElements.length} comparison elements)`)

  return uid_list
}

export const getFileAsBase64 = (file) => {
  if (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      reader.onload = () => resolve(reader.result)
      reader.onerror = err => reject(err)
    })
  }
}

export const getAggregateDimensionsList = report => {
  let dimensions = []
  if (report) {
    let parser = new DOMParser()
    const doc = parser.parseFromString(report.html, 'text/html')
    if (doc) {
      const aggregateElements = doc.querySelectorAll('[data-type="AGGREGATE"]')
      for (let el of aggregateElements) {
        const id = el.getAttribute('id')
        const dx = id?.split('|')?.[0]
        if (dx) {
          dimensions.push(dx)
        }
      }
    }
  }

  return dimensions
}

export const cleanAggrateDimensionData = (report, dimensions, period, periodType, selectedOU, orgUnits, orgUnitLevels, legendContentList, organisationUnitGroups, indicatorMetadata = {}) => {
  if (report) {
    const aggregateElements = document.querySelectorAll('[data-type="AGGREGATE"]')
    for (let el of aggregateElements) {
      const el_ID = el?.getAttribute('id')
      const legend_id = el_ID?.split('|')?.[2]
      const data_has_organisationUnitGroup = el.getAttribute('data-has-organisationunitgroup')
      const OrgUnitString = el_ID?.split('|')?.[1]

      el.innerHTML = ""
      el.style.background = "transparent"
      el.style.color = "#000000"

      for (let d of dimensions) {
        if (el_ID?.includes(d) && legend_id) {

          // Calculate effective period for this dimension if it has offsets
          let effectivePeriod = period
          if (indicatorMetadata[d]) {
            const minOffset = Math.min(...indicatorMetadata[d].offsets)
            effectivePeriod = calculateEffectivePeriod(period, periodType, minOffset)
          }

          const current_legend_parent = legendContentList.find(leg => leg.id === legend_id)
          const current_legend = findTheRightLegend(current_legend_parent, effectivePeriod, periodType)

          if (current_legend_parent && current_legend) {
            if (!data_has_organisationUnitGroup || data_has_organisationUnitGroup === "NO") {// ====> VALEUR MANQUANTE
              defaultMissingValueToApply(el_ID, current_legend)
            }

            // ====> NON APPLICABLE legend
            if (data_has_organisationUnitGroup === "YES") {
              const ouGId = el_ID?.split('|')?.[4]
              const ou = getOrgUnitIdFromParentString(OrgUnitString, selectedOU, orgUnits, orgUnitLevels)

              if (ou && ouGId) {
                if (checkIfOuInGroup(ouGId, ou.id, organisationUnitGroups)) {
                  defaultMissingValueToApply(el_ID, current_legend)
                } else {
                  defaultNotApplicableValueToApply(el_ID, current_legend)
                }
              } else {
                defaultNotApplicableValueToApply(el_ID, current_legend)
              }
            }
          }
        }
      }
    }
  }
}

const checkIfOuInGroup = (ouGId, ou_id, organisationUnitGroups) => {
  try {
    const organisatinUnitGroup = organisationUnitGroups.find(ouG => ouG.id === ouGId)

    if (organisatinUnitGroup?.organisationUnits.map(ou => ou.id).includes(ou_id)) {
      return true
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}

export const updateAndInjectSchoolNames = (report, selectedOu, organisationUnits = [], organisationUnitLevels) => {
  if (report) {
    const otherElementsHTML = document.querySelectorAll('[data-type="'.concat(OTHER_ELEMENT).concat('"]'))

    for (let el of otherElementsHTML) {

      const data_is = el.getAttribute('data-is')

      if (data_is === ORGANISATION_UNIT_NAME) {

        el.innerHTML = ""
        const id_string = el.getAttribute('id')

        const ouNames = []

        const htmlOUList = id_string?.split('|')

        for (let htmlOu of htmlOUList) {
          const name_found = getOrgUnitIdFromParentString(htmlOu, selectedOu, organisationUnits, organisationUnitLevels)
          if (name_found) {
            ouNames.push(name_found)
          }
        }

        el.innerHTML = ouNames.map(ouName => ouName.name).join(" - ")
      }
    }

  }
}


export const updateAndInjectOtherElementPeriod = (report, selectedDate, selectedPeriodType) => {
  if (report) {
    const otherElementsHTML = document.querySelectorAll('[data-type="'.concat(OTHER_ELEMENT).concat('"]'))

    for (let el of otherElementsHTML) {
      const data_is = el.getAttribute('data-is')

      if (data_is === SELECTED_DATE) {

        el.innerHTML = ""
        el.innerHTML = formatPeriodForAnalytic(selectedDate, selectedPeriodType)

      }
    }
  }
}

export const loadDataStore = async (key_string, setLoading, setState, payload = null) => {
  try {

    if (!key_string)
      throw new Error('Please specify the key_string of the datastore to retrieve')

    setLoading && setLoading(true)

    const route = `${DATA_STORE_ROUTE}/${process.env.REACT_APP_DATA_STORE_NAME}/${key_string}`
    const response = await axios.get(route)
    const data = response.data

    setState && setState(data)
    setLoading && setLoading(false)
    return data
  } catch (err) {
    setLoading && setLoading(false)
    const defaultValue = payload ? payload : []
    setState && setState(defaultValue)

    // Don't let POST failure block returning the default value
    try {
      await createDataToDataStore(key_string, defaultValue)
    } catch (createError) {
      // Log but don't throw - we still want to return defaultValue
      console.error(`Failed to create datastore key ${key_string}:`, createError)
    }

    return defaultValue  // Always executes, regardless of POST outcome
  }
}

export const saveDataToDataStore = async (key_string, payload, setLoading, setState, setErrorMessage, createIfNotExist = false) => {
  try {

    if (!key_string)
      throw new Error('Please specify the key_string of the datastore to retrieve')

    if (!payload)
      throw new Error('Please add the payload to save in the datastore !')

    setLoading && setLoading(true)
    const route = `${DATA_STORE_ROUTE}/${process.env.REACT_APP_DATA_STORE_NAME}/${key_string}`
    let response = null

    if (createIfNotExist) {
      //  The will first check if this key exist before make some put (update) or make post ( create new )
      try {
        await loadDataStore(key_string, null, null, {})
      } catch (err) {
      }
    }

    response = await axios.put(route, payload)

    const data = response?.data

    setState && setState(data)
    setLoading && setLoading(false)

    return true

  } catch (err) {
    setErrorMessage && setErrorMessage(err.message)
    setLoading && setLoading(false)
    throw err
  }
}

export const createDataToDataStore = async (key_string, payload) => {
  try {

    if (!key_string)
      throw new Error('Please specify the key_string of the datastore to retrieve')

    const route = `${DATA_STORE_ROUTE}/${process.env.REACT_APP_DATA_STORE_NAME}/${key_string}`
    await axios.post(route, payload || [])

    return true

  } catch (err) {
    throw err
  }
}

export const deleteKeyFromDataStore = async (key_string) => {
  try {

    if (!key_string)
      throw new Error('Please specify the key_string of the datastore to retrieve')

    const route = `${DATA_STORE_ROUTE}/${process.env.REACT_APP_DATA_STORE_NAME}/${key_string}`
    await axios.delete(route)

    return true

  } catch (err) {
    // throw err
  }
}

export const formatPeriodForAnalytic = (period, periodType) => {
  if (periodType === DAY)
    return dayjs(period).format('YYYYMMDD')
  if (periodType === YEAR)
    return dayjs(period).format('YYYY')
  if (periodType === MONTH)
    return dayjs(period).format('YYYYMM')
}

/**
 * Extract period offsets from indicator expressions (numerator/denominator)
 * DHIS2 indicators can reference previous periods using syntax like:
 * - "#{dataElement}.periodOffset(-1)" for 1 month back
 * - "#{dataElement}.periodOffset(-12)" for 12 months back
 * @param {string} expression - The indicator numerator or denominator expression
 * @returns {number[]} Array of unique period offsets found (e.g., [-1, -12])
 */
export const extractPeriodOffsets = (expression) => {
  if (!expression) return []

  // Updated regex to handle optional whitespace around the offset number
  // Matches both .periodOffset(-1) and .periodOffset( -1 ) with spaces
  const offsetPattern = /\.periodOffset\(\s*(-?\d+)\s*\)/g
  const offsets = []
  let match

  while ((match = offsetPattern.exec(expression)) !== null) {
    const offset = parseInt(match[1])
    if (!offsets.includes(offset)) {
      offsets.push(offset)
    }
  }

  return offsets.sort((a, b) => a - b) // Sort from most negative to positive
}

/**
 * Build period range string for analytics API when indicator has period offsets
 * @param {string} basePeriod - User-selected period (e.g., "2024-01-01")
 * @param {string} periodType - Period type (YEAR, MONTH, DAY)
 * @param {number[]} offsets - Array of period offsets (e.g., [-1, 0])
 * @returns {string} Semicolon-separated period string (e.g., "202312;202401")
 */
export const buildPeriodRangeForOffset = (basePeriod, periodType, offsets) => {
  if (!offsets || offsets.length === 0) {
    return formatPeriodForAnalytic(basePeriod, periodType)
  }

  const periods = offsets.map(offset => {
    let adjustedPeriod = dayjs(basePeriod)

    if (periodType === MONTH) {
      adjustedPeriod = adjustedPeriod.add(offset, 'month')
      return adjustedPeriod.format('YYYYMM')
    } else if (periodType === YEAR) {
      adjustedPeriod = adjustedPeriod.add(offset, 'year')
      return adjustedPeriod.format('YYYY')
    } else if (periodType === DAY) {
      adjustedPeriod = adjustedPeriod.add(offset, 'day')
      return adjustedPeriod.format('YYYYMMDD')
    }

    return formatPeriodForAnalytic(adjustedPeriod.toDate(), periodType)
  })

  // Always include the base period
  const basePeriodFormatted = formatPeriodForAnalytic(basePeriod, periodType)
  if (!periods.includes(basePeriodFormatted)) {
    periods.push(basePeriodFormatted)
  }

  return [...new Set(periods)].sort().join(';')
}

/**
 * Calculate the effective period for legend matching when indicator has period offset
 * For indicators with offsets, the legend should match the period used in calculation,
 * not the user-selected period.
 * @param {string} basePeriod - User-selected period (e.g., "2024-01-01")
 * @param {string} periodType - Period type (YEAR, MONTH, DAY)
 * @param {number} offset - Period offset (e.g., -1 for previous month, 0 for current)
 * @returns {Date} Effective period date for legend matching
 */
export const calculateEffectivePeriod = (basePeriod, periodType, offset = 0) => {
  if (offset === 0) {
    return basePeriod
  }

  let adjustedPeriod = dayjs(basePeriod)

  if (periodType === MONTH) {
    adjustedPeriod = adjustedPeriod.add(offset, 'month')
  } else if (periodType === YEAR) {
    adjustedPeriod = adjustedPeriod.add(offset, 'year')
  } else if (periodType === DAY) {
    adjustedPeriod = adjustedPeriod.add(offset, 'day')
  }

  return adjustedPeriod.toDate()
}

/**
 * Calculate period with offset applied
 *
 * @param {string|Date} basePeriod - Base period from which to calculate offset
 * @param {string} periodType - Type of period (MONTH, YEAR, QUARTER, WEEK, DAY)
 * @param {number} offset - Period offset (0 = current, -1 = previous, -12 = year ago, etc.)
 * @returns {string} - Formatted period string for DHIS2 Analytics API
 */
export const calculateOffsetPeriod = (basePeriod, periodType, offset) => {
  if (!offset || offset === 0) {
    // No offset, just format the base period
    return formatPeriodForAnalytic(basePeriod, periodType)
  }

  let adjustedPeriod = dayjs(basePeriod)

  switch (periodType) {
    case MONTH:
      adjustedPeriod = adjustedPeriod.add(offset, 'month')
      return adjustedPeriod.format('YYYYMM')

    case YEAR:
      adjustedPeriod = adjustedPeriod.add(offset, 'year')
      return adjustedPeriod.format('YYYY')

    case QUARTERLY:
      adjustedPeriod = adjustedPeriod.add(offset * 3, 'month')
      const quarter = adjustedPeriod.quarter()
      return `${adjustedPeriod.year()}Q${quarter}`

    case WEEK:
    case WEEKLY:
      adjustedPeriod = adjustedPeriod.add(offset, 'week')
      const week = adjustedPeriod.week()
      return `${adjustedPeriod.year()}W${week.toString().padStart(2, '0')}`

    case DAY:
      adjustedPeriod = adjustedPeriod.add(offset, 'day')
      return adjustedPeriod.format('YYYYMMDD')

    default:
      console.warn(`[Report Builder] Unknown period type for offset calculation: ${periodType}`)
      return formatPeriodForAnalytic(basePeriod, periodType)
  }
}

/**
 * Extract comparison dimensions from HTML template with their period offsets
 *
 * @param {string} html_code - HTML template code
 * @returns {Array<{id: string, offset: number}>} - Array of dimension objects with offsets
 */
export const getComparisonDimensionsListWithOffsets = (html_code) => {
  if (!html_code) {
    return []
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(html_code, "text/html")

  const comparisonElements = doc.querySelectorAll('[data-type="AGGREGATE_COMPARISON"]')

  const dimensionsWithOffsets = []
  for (let el of comparisonElements) {
    const primaryId = el.getAttribute('data-primary-id')
    const primaryOffset = parseInt(el.getAttribute('data-primary-offset') || '0')
    const comparisonId = el.getAttribute('data-comparison-id')
    const comparisonOffset = parseInt(el.getAttribute('data-comparison-offset') || '0')

    if (primaryId) {
      dimensionsWithOffsets.push({ id: primaryId, offset: primaryOffset })
    }
    if (comparisonId) {
      dimensionsWithOffsets.push({ id: comparisonId, offset: comparisonOffset })
    }
  }

  console.log(`[Report Builder] Extracted ${dimensionsWithOffsets.length} comparison dimensions with offsets:`, dimensionsWithOffsets)

  return dimensionsWithOffsets
}
