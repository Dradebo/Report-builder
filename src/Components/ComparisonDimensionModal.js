import React, { useState } from 'react'
import {
  Modal,
  ModalTitle,
  ModalContent,
  ModalActions,
  Button,
  ButtonStrip,
  Field,
  SingleSelect,
  SingleSelectOption,
  Radio,
  Input,
  NoticeBox
} from '@dhis2/ui'
import { DataDimension } from '@dhis2/analytics'

/**
 * ComparisonDimensionModal - Modal for configuring indicator comparisons
 *
 * Allows users to select two indicators with period offsets and configure
 * how they should be compared (difference, percentage change, ratio, boolean)
 */
const ComparisonDimensionModal = ({
  isOpen,
  onClose,
  onInsert,
  legends = [],
  organisationUnitLevels = [],
  prefillPrimaryIndicator = null,
  availableDimensions = [],
  // Existing settings (for editing)
  existingMode = null,
  existingComparisonIndicator = null,
  existingPrimaryOffset = null,
  existingComparisonOffset = null,
  existingOperator = null,
  existingDisplayFormat = null,
  existingLegend = null,
  existingLegendType = null,
  existingConditions = null,
  existingOrgUnitLevel = null
}) => {
  // Comparison mode: SIMPLE or CONDITIONAL
  const [comparisonMode, setComparisonMode] = useState(existingMode || 'SIMPLE')

  // Primary indicator state
  const [primaryIndicator, setPrimaryIndicator] = useState(prefillPrimaryIndicator)
  const [primaryOffset, setPrimaryOffset] = useState(existingPrimaryOffset || '0')

  // Comparison indicator state
  const [comparisonIndicator, setComparisonIndicator] = useState(existingComparisonIndicator || null)
  const [comparisonOffset, setComparisonOffset] = useState(existingComparisonOffset || '-1')

  // SIMPLE mode: single operator
  const [comparisonOperator, setComparisonOperator] = useState(existingOperator || 'DIFFERENCE')
  const [displayFormat, setDisplayFormat] = useState(existingDisplayFormat || 'RAW')
  const [selectedLegend, setSelectedLegend] = useState(existingLegend || null)
  const [legendType, setLegendType] = useState(existingLegendType || 'color')
  const [orgUnitLevel, setOrgUnitLevel] = useState(existingOrgUnitLevel || 'CURRENT')

  // CONDITIONAL mode: array of condition branches (operator + mappedValue only)
  const [conditions, setConditions] = useState(
    existingConditions && existingConditions.length > 0
      ? existingConditions
      : [{ operator: 'GREATER_THAN', mappedValue: '1' }]
  )

  // CONDITIONAL mode: shared legend selection
  const [conditionalLegend, setConditionalLegend] = useState(existingLegend || null)
  const [conditionalLegendType, setConditionalLegendType] = useState(existingLegendType || 'color')

  // Validation error
  const [errorMessage, setErrorMessage] = useState('')

  // Update state when existing settings change (modal reopened with new data)
  React.useEffect(() => {
    if (existingMode) setComparisonMode(existingMode)
    if (existingPrimaryOffset) setPrimaryOffset(existingPrimaryOffset)
    if (existingComparisonIndicator) setComparisonIndicator(existingComparisonIndicator)
    if (existingComparisonOffset) setComparisonOffset(existingComparisonOffset)
    if (existingOperator) setComparisonOperator(existingOperator)
    if (existingDisplayFormat) setDisplayFormat(existingDisplayFormat)
    if (existingLegend) {
      setSelectedLegend(existingLegend)
      setConditionalLegend(existingLegend)
    }
    if (existingLegendType) {
      setLegendType(existingLegendType)
      setConditionalLegendType(existingLegendType)
    }
    if (existingConditions && existingConditions.length > 0) {
      setConditions(existingConditions)
    }
    if (existingOrgUnitLevel) setOrgUnitLevel(existingOrgUnitLevel)
  }, [existingMode, existingPrimaryOffset, existingComparisonIndicator, existingComparisonOffset,
      existingOperator, existingDisplayFormat, existingLegend, existingLegendType,
      existingConditions, existingOrgUnitLevel])

  // Update primary indicator when prefill changes
  React.useEffect(() => {
    if (prefillPrimaryIndicator && !primaryIndicator) {
      setPrimaryIndicator(prefillPrimaryIndicator)
    }
  }, [prefillPrimaryIndicator])

  const handlePrimaryIndicatorChange = ({ items }) => {
    if (items && items.length > 0) {
      setPrimaryIndicator({
        id: items[0].id,
        name: items[0].name
      })
      setErrorMessage('')
    } else {
      setPrimaryIndicator(null)
    }
  }

  const handleComparisonIndicatorChange = ({ items }) => {
    if (items && items.length > 0) {
      setComparisonIndicator({
        id: items[0].id,
        name: items[0].name
      })
      setErrorMessage('')
    } else {
      setComparisonIndicator(null)
    }
  }

  const handleInsert = () => {
    // Validation
    if (availableDimensions.length === 0) {
      setErrorMessage('No dimensions configured in this report. Please add dimensions first.')
      return
    }
    if (!primaryIndicator) {
      setErrorMessage('Please select a primary indicator')
      return
    }
    if (!comparisonIndicator) {
      setErrorMessage('Please select a comparison indicator')
      return
    }

    if (comparisonMode === 'SIMPLE') {
      // Simple mode validation
      if (displayFormat === 'LEGEND' && !selectedLegend) {
        setErrorMessage('Please select a legend or choose "Raw Value" display format')
        return
      }

      // Build SIMPLE configuration object
      const config = {
        mode: 'SIMPLE',
        primaryIndicator,
        primaryPeriodOffset: parseInt(primaryOffset),
        comparisonIndicator,
        comparisonPeriodOffset: parseInt(comparisonOffset),
        operator: comparisonOperator,
        displayFormat,
        legend: displayFormat === 'LEGEND' ? {
          id: selectedLegend,
          type: legendType
        } : null,
        orgUnitLevel
      }

      onInsert(config)
      handleReset()
    } else {
      // Conditional mode validation
      if (conditions.length === 0) {
        setErrorMessage('Please add at least one condition branch')
        return
      }

      for (let i = 0; i < conditions.length; i++) {
        const cond = conditions[i]
        if (!cond.operator) {
          setErrorMessage(`Condition ${i + 1}: Please select an operator`)
          return
        }
        if (!cond.mappedValue || isNaN(parseFloat(cond.mappedValue))) {
          setErrorMessage(`Condition ${i + 1}: Please enter a valid numeric mapped value`)
          return
        }
      }

      // Validate shared legend selection
      if (!conditionalLegend) {
        setErrorMessage('Please select a legend for conditional comparison')
        return
      }

      // Build CONDITIONAL configuration object
      const config = {
        mode: 'CONDITIONAL',
        primaryIndicator,
        primaryPeriodOffset: parseInt(primaryOffset),
        comparisonIndicator,
        comparisonPeriodOffset: parseInt(comparisonOffset),
        conditions: conditions.map(cond => ({
          operator: cond.operator,
          mappedValue: parseFloat(cond.mappedValue)
        })),
        legend: {
          id: conditionalLegend,
          type: conditionalLegendType
        },
        orgUnitLevel
      }

      onInsert(config)
      handleReset()
    }
  }

  const handleReset = () => {
    setPrimaryIndicator(prefillPrimaryIndicator)
    setPrimaryOffset('0')
    setComparisonIndicator(null)
    setComparisonOffset('-1')
    setComparisonMode('SIMPLE')
    setComparisonOperator('DIFFERENCE')
    setDisplayFormat('RAW')
    setSelectedLegend(null)
    setLegendType('color')
    setOrgUnitLevel('CURRENT')
    setConditions([
      { operator: 'GREATER_THAN', mappedValue: '1' }
    ])
    setConditionalLegend(null)
    setConditionalLegendType('color')
    setErrorMessage('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // Conditional branch management functions
  const handleAddCondition = () => {
    if (conditions.length >= 5) {
      setErrorMessage('Maximum 5 condition branches allowed')
      return
    }
    setConditions([...conditions, { operator: 'LESS_THAN', mappedValue: '-1' }])
    setErrorMessage('')
  }

  const handleRemoveCondition = (index) => {
    if (conditions.length <= 1) {
      setErrorMessage('At least one condition branch is required')
      return
    }
    const newConditions = conditions.filter((_, i) => i !== index)
    setConditions(newConditions)
    setErrorMessage('')
  }

  const handleUpdateCondition = (index, field, value) => {
    const newConditions = [...conditions]
    newConditions[index][field] = value
    setConditions(newConditions)
    setErrorMessage('')
  }

  const getConditionLabel = (index) => {
    if (index === 0) return 'IF'
    if (index === conditions.length - 1 && conditions[index].operator === 'EQUAL') return 'ELSE (fallback)'
    return 'ELSE IF'
  }

  return (
    <Modal large open={isOpen} onClose={handleClose}>
      <ModalTitle>Configure Indicator Comparison</ModalTitle>
      <ModalContent>
        {errorMessage && (
          <div style={{ marginBottom: '16px' }}>
            <NoticeBox error title="Validation Error">
              {errorMessage}
            </NoticeBox>
          </div>
        )}

        {/* Primary Indicator Section */}
        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Primary Indicator (A)
          </h3>

          {availableDimensions.length === 0 ? (
            <NoticeBox warning title="No dimensions configured">
              Please configure dimensions for this report first before creating comparisons.
            </NoticeBox>
          ) : (
            <Field
              label="Select Indicator"
              helpText="Pre-filled from clicked indicator, or choose from report dimensions"
            >
              <SingleSelect
                placeholder="Choose an indicator from report dimensions"
                selected={primaryIndicator?.id}
                onChange={({ selected }) => {
                  const selectedDim = availableDimensions.find(d => d.id === selected)
                  if (selectedDim) {
                    handlePrimaryIndicatorChange({ items: [selectedDim] })
                  }
                }}
                filterable
                filterPlaceholder="Search indicators..."
              >
                {availableDimensions.map(dim => (
                  <SingleSelectOption
                    key={dim.id}
                    label={dim.name || dim.displayName}
                    value={dim.id}
                  />
                ))}
              </SingleSelect>
            </Field>
          )}

          {primaryIndicator && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Selected:</strong> {primaryIndicator.name}
            </div>
          )}

          <Field
            label="Period Offset"
            helpText="0 = current period, -1 = previous period, -12 = 12 periods ago"
            style={{ marginTop: '16px' }}
          >
            <Input
              type="number"
              value={primaryOffset}
              onChange={({ value }) => setPrimaryOffset(value)}
              placeholder="0"
            />
          </Field>
        </div>

        {/* Comparison Indicator Section */}
        <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
            Comparison Indicator (B)
          </h3>

          {availableDimensions.length === 0 ? (
            <NoticeBox warning title="No dimensions configured">
              Please configure dimensions for this report first before creating comparisons.
            </NoticeBox>
          ) : (
            <Field
              label="Select Indicator"
              helpText="Only indicators configured in this report are shown"
            >
              <SingleSelect
                placeholder="Choose an indicator from report dimensions"
                selected={comparisonIndicator?.id}
                onChange={({ selected }) => {
                  const selectedDim = availableDimensions.find(d => d.id === selected)
                  if (selectedDim) {
                    handleComparisonIndicatorChange({ items: [selectedDim] })
                  }
                }}
                filterable
                filterPlaceholder="Search indicators..."
              >
                {availableDimensions.map(dim => (
                  <SingleSelectOption
                    key={dim.id}
                    label={dim.name || dim.displayName}
                    value={dim.id}
                  />
                ))}
              </SingleSelect>
            </Field>
          )}

          {comparisonIndicator && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Selected:</strong> {comparisonIndicator.name}
            </div>
          )}

          <Field
            label="Period Offset"
            helpText="0 = current period, -1 = previous period, -12 = 12 periods ago"
            style={{ marginTop: '16px' }}
          >
            <Input
              type="number"
              value={comparisonOffset}
              onChange={({ value }) => setComparisonOffset(value)}
              placeholder="-1"
            />
          </Field>
        </div>

        {/* Comparison Mode Selection */}
        <div style={{ marginBottom: '24px', padding: '16px', border: '2px solid #4caf50', borderRadius: '4px', backgroundColor: '#f9fdf9' }}>
          <Field label="Comparison Mode">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Radio
                label="Simple Comparison (single operator)"
                value="SIMPLE"
                checked={comparisonMode === 'SIMPLE'}
                onChange={() => {
                  setComparisonMode('SIMPLE')
                  setErrorMessage('')
                }}
              />
              <Radio
                label="Conditional Comparison (if-then-else branches)"
                value="CONDITIONAL"
                checked={comparisonMode === 'CONDITIONAL'}
                onChange={() => {
                  setComparisonMode('CONDITIONAL')
                  setErrorMessage('')
                }}
              />
            </div>
          </Field>
        </div>

        {/* SIMPLE Mode: Comparison Type Section */}
        {comparisonMode === 'SIMPLE' && (
          <div style={{ marginBottom: '24px' }}>
            <Field label="Comparison Type">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Radio
                  label="Difference (A - B)"
                  value="DIFFERENCE"
                  checked={comparisonOperator === 'DIFFERENCE'}
                  onChange={() => setComparisonOperator('DIFFERENCE')}
                />
                <Radio
                  label="Percentage Change ((A-B)/B * 100)"
                  value="PERCENTAGE_CHANGE"
                  checked={comparisonOperator === 'PERCENTAGE_CHANGE'}
                  onChange={() => setComparisonOperator('PERCENTAGE_CHANGE')}
                />
                <Radio
                  label="Ratio (A / B)"
                  value="RATIO"
                  checked={comparisonOperator === 'RATIO'}
                  onChange={() => setComparisonOperator('RATIO')}
                />
                <Radio
                  label="Boolean: A > B"
                  value="GREATER_THAN"
                  checked={comparisonOperator === 'GREATER_THAN'}
                  onChange={() => setComparisonOperator('GREATER_THAN')}
                />
                <Radio
                  label="Boolean: A < B"
                  value="LESS_THAN"
                  checked={comparisonOperator === 'LESS_THAN'}
                  onChange={() => setComparisonOperator('LESS_THAN')}
                />
                <Radio
                  label="Boolean: A = B"
                  value="EQUAL"
                  checked={comparisonOperator === 'EQUAL'}
                  onChange={() => setComparisonOperator('EQUAL')}
                />
              </div>
            </Field>
          </div>
        )}

        {/* CONDITIONAL Mode: Condition Branches */}
        {comparisonMode === 'CONDITIONAL' && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>
              Conditional Branches (If-Then-Else)
            </h3>

            {/* Shared Legend Selection for All Branches */}
            <div style={{ marginBottom: '20px', padding: '16px', border: '2px solid #2196f3', borderRadius: '4px', backgroundColor: '#e3f2fd' }}>
              <Field label="Legend (applies to all branches)">
                <SingleSelect
                  placeholder="Choose legend to apply"
                  selected={conditionalLegend}
                  onChange={({ selected }) => setConditionalLegend(selected)}
                >
                  {(legends || []).map(leg => (
                    <SingleSelectOption key={leg.id} label={leg.name} value={leg.id} />
                  ))}
                </SingleSelect>
              </Field>

              {conditionalLegend && (
                <Field label="Legend Display Type" style={{ marginTop: '16px' }}>
                  <SingleSelect
                    placeholder="Choose legend display type"
                    selected={conditionalLegendType}
                    onChange={({ selected }) => setConditionalLegendType(selected)}
                  >
                    <SingleSelectOption label="Color" value="color" />
                    <SingleSelectOption label="Label" value="label" />
                    <SingleSelectOption label="Image" value="image" />
                    <SingleSelectOption label="Pie Chart" value="pie" />
                  </SingleSelect>
                </Field>
              )}
            </div>

            {conditions.map((condition, index) => (
              <div key={index} style={{
                marginBottom: '16px',
                padding: '16px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: index === 0 ? '#e8f5e9' : index === conditions.length - 1 ? '#fff3e0' : '#f5f5f5'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '14px', color: '#333' }}>
                    Condition {index + 1} ({getConditionLabel(index)})
                  </strong>
                  {index > 0 && (
                    <Button small secondary onClick={() => handleRemoveCondition(index)}>
                      Remove
                    </Button>
                  )}
                </div>

                <Field label="Operator">
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Radio
                      label="A > B"
                      value="GREATER_THAN"
                      checked={condition.operator === 'GREATER_THAN'}
                      onChange={() => handleUpdateCondition(index, 'operator', 'GREATER_THAN')}
                    />
                    <Radio
                      label="A < B"
                      value="LESS_THAN"
                      checked={condition.operator === 'LESS_THAN'}
                      onChange={() => handleUpdateCondition(index, 'operator', 'LESS_THAN')}
                    />
                    <Radio
                      label="A = B"
                      value="EQUAL"
                      checked={condition.operator === 'EQUAL'}
                      onChange={() => handleUpdateCondition(index, 'operator', 'EQUAL')}
                    />
                  </div>
                </Field>

                <Field
                  label="Map to numeric value"
                  helpText="This value will be matched against the legend ranges above"
                  style={{ marginTop: '12px' }}
                >
                  <Input
                    type="number"
                    step="any"
                    value={condition.mappedValue}
                    onChange={({ value }) => handleUpdateCondition(index, 'mappedValue', value)}
                    placeholder="0"
                  />
                </Field>
              </div>
            ))}

            <Button onClick={handleAddCondition} disabled={conditions.length >= 5}>
              + Add Condition Branch
            </Button>
            {conditions.length >= 5 && (
              <div style={{ marginTop: '8px', color: '#ff9800', fontSize: '12px' }}>
                Maximum 5 branches reached
              </div>
            )}
          </div>
        )}

        {/* SIMPLE Mode: Display Format Section */}
        {comparisonMode === 'SIMPLE' && (
          <div style={{ marginBottom: '24px' }}>
            <Field label="Display Format">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Radio
                  label="Raw Value"
                  value="RAW"
                  checked={displayFormat === 'RAW'}
                  onChange={() => {
                    setDisplayFormat('RAW')
                    setSelectedLegend(null)
                  }}
                />
                <Radio
                  label="Apply Legend"
                  value="LEGEND"
                  checked={displayFormat === 'LEGEND'}
                  onChange={() => setDisplayFormat('LEGEND')}
                />
              </div>
            </Field>

            {displayFormat === 'LEGEND' && (
              <div style={{ marginTop: '16px', marginLeft: '24px' }}>
                <Field label="Select Legend">
                  <SingleSelect
                    placeholder="Choose legend to apply"
                    selected={selectedLegend}
                    onChange={({ selected }) => setSelectedLegend(selected)}
                  >
                    {(legends || []).map(leg => (
                      <SingleSelectOption key={leg.id} label={leg.name} value={leg.id} />
                    ))}
                  </SingleSelect>
                </Field>

                {selectedLegend && (
                  <Field label="Legend Display Type" style={{ marginTop: '16px' }}>
                    <SingleSelect
                      placeholder="Choose legend display type"
                      selected={legendType}
                      onChange={({ selected }) => setLegendType(selected)}
                    >
                      <SingleSelectOption label="Color" value="color" />
                      <SingleSelectOption label="Label" value="label" />
                      <SingleSelectOption label="Image" value="image" />
                      <SingleSelectOption label="Pie Chart" value="pie" />
                    </SingleSelect>
                  </Field>
                )}
              </div>
            )}
          </div>
        )}

        {/* Organisation Unit Level Section */}
        <div style={{ marginBottom: '16px' }}>
          <Field label="Organisation Unit Level">
            <SingleSelect
              placeholder="Select organisation unit level"
              selected={orgUnitLevel}
              onChange={({ selected }) => setOrgUnitLevel(selected)}
            >
              <SingleSelectOption label="Current" value="CURRENT" />
              <SingleSelectOption label="Parent Level 1" value="PARENT_1" />
              <SingleSelectOption label="Parent Level 2" value="PARENT_2" />
              <SingleSelectOption label="Parent Level 3" value="PARENT_3" />
              <SingleSelectOption label="Parent Level 4" value="PARENT_4" />
              <SingleSelectOption label="Parent Level 5" value="PARENT_5" />
            </SingleSelect>
          </Field>
        </div>

      </ModalContent>
      <ModalActions>
        <ButtonStrip>
          <Button onClick={handleClose}>Cancel</Button>
          <Button primary onClick={handleInsert}>
            Insert Element
          </Button>
        </ButtonStrip>
      </ModalActions>
    </Modal>
  )
}

export default ComparisonDimensionModal
