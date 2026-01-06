/**
 * Comparison Functions for DHIS2 Report Builder
 *
 * Provides utilities for comparing two indicator values
 * and formatting the comparison results for display.
 */

/**
 * Compare two indicator values based on operator
 *
 * @param {number|string} valueA - Primary indicator value
 * @param {number|string} valueB - Comparison indicator value
 * @param {string} operator - Comparison type (DIFFERENCE, PERCENTAGE_CHANGE, RATIO, GREATER_THAN, LESS_THAN, EQUAL)
 * @returns {number|boolean|null} - Comparison result, or null if invalid
 */
export const compareIndicators = (valueA, valueB, operator) => {
  const numA = parseFloat(valueA)
  const numB = parseFloat(valueB)

  // Handle missing/invalid values
  if (isNaN(numA) || isNaN(numB)) {
    console.warn(`[Report Builder] Invalid comparison values: A=${valueA}, B=${valueB}`)
    return null
  }

  switch (operator) {
    case "DIFFERENCE":
      return numA - numB

    case "PERCENTAGE_CHANGE":
      if (numB === 0) {
        console.warn(`[Report Builder] Division by zero in PERCENTAGE_CHANGE: ${numA} / ${numB}`)
        return null
      }
      return ((numA - numB) / numB) * 100

    case "RATIO":
      if (numB === 0) {
        console.warn(`[Report Builder] Division by zero in RATIO: ${numA} / ${numB}`)
        return null
      }
      return numA / numB

    case "GREATER_THAN":
      return numA > numB

    case "LESS_THAN":
      return numA < numB

    case "EQUAL":
      return numA === numB

    default:
      console.warn(`[Report Builder] Unknown comparison operator: ${operator}`)
      return null
  }
}

/**
 * Format comparison result for display
 *
 * @param {number|boolean|null} result - Comparison result
 * @param {string} operator - Comparison type
 * @returns {string} - Formatted display string
 */
export const formatComparisonResult = (result, operator) => {
  if (result === null || result === undefined) {
    return "N/A"
  }

  switch (operator) {
    case "PERCENTAGE_CHANGE":
      return `${result.toFixed(1)}%`

    case "RATIO":
      return result.toFixed(2)

    case "DIFFERENCE":
      return result.toFixed(0)

    case "GREATER_THAN":
    case "LESS_THAN":
    case "EQUAL":
      return result ? "Yes" : "No"

    default:
      return String(result)
  }
}

/**
 * Get human-readable description of comparison operator
 *
 * @param {string} operator - Comparison operator
 * @returns {string} - Human-readable description
 */
export const getOperatorDescription = (operator) => {
  switch (operator) {
    case "DIFFERENCE":
      return "Difference (A - B)"
    case "PERCENTAGE_CHANGE":
      return "Percentage Change ((A-B)/B * 100)"
    case "RATIO":
      return "Ratio (A / B)"
    case "GREATER_THAN":
      return "A > B"
    case "LESS_THAN":
      return "A < B"
    case "EQUAL":
      return "A = B"
    default:
      return operator
  }
}

/**
 * Evaluate conditional comparison and return mapped numeric value
 *
 * Evaluates conditions in order (IF, ELSE IF, ..., ELSE) and returns
 * the mapped numeric value from the first matching condition.
 *
 * @param {number|string} valueA - Primary indicator value
 * @param {number|string} valueB - Comparison indicator value
 * @param {Array} conditions - Array of condition objects with {operator, mappedValue, legendId, legendType}
 * @returns {number|null} - Mapped numeric value from matching condition, or null if invalid/no match
 */
export const evaluateConditionalComparison = (valueA, valueB, conditions) => {
  const numA = parseFloat(valueA)
  const numB = parseFloat(valueB)

  // Handle missing/invalid values
  if (isNaN(numA) || isNaN(numB)) {
    console.warn(`[Report Builder] Invalid comparison values: A=${valueA}, B=${valueB}`)
    return null
  }

  if (!conditions || conditions.length === 0) {
    console.warn('[Report Builder] No conditions provided for conditional comparison')
    return null
  }

  // Evaluate conditions in order (IF, ELSE IF, ELSE IF, ..., ELSE)
  for (const condition of conditions) {
    const result = compareIndicators(numA, numB, condition.operator)

    if (result === true) {
      // Condition matched, return mapped value
      const mappedValue = parseFloat(condition.mappedValue)
      if (isNaN(mappedValue)) {
        console.warn(`[Report Builder] Invalid mapped value in condition: ${condition.mappedValue}`)
        return null
      }
      return mappedValue
    }
  }

  // No condition matched (shouldn't happen if EQUAL fallback exists)
  console.warn('[Report Builder] No conditional branch matched', { valueA: numA, valueB: numB, conditions })
  return null
}
