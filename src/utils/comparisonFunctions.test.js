import { compareIndicators, formatComparisonResult, getOperatorDescription } from './comparisonFunctions'

describe('compareIndicators', () => {
  describe('DIFFERENCE operator', () => {
    test('100 - 80 = 20', () => {
      expect(compareIndicators(100, 80, 'DIFFERENCE')).toBe(20)
    })

    test('80 - 100 = -20', () => {
      expect(compareIndicators(80, 100, 'DIFFERENCE')).toBe(-20)
    })

    test('50.5 - 25.3 = 25.2', () => {
      expect(compareIndicators(50.5, 25.3, 'DIFFERENCE')).toBeCloseTo(25.2, 1)
    })
  })

  describe('PERCENTAGE_CHANGE operator', () => {
    test('(120 - 100) / 100 * 100 = 20%', () => {
      expect(compareIndicators(120, 100, 'PERCENTAGE_CHANGE')).toBe(20)
    })

    test('(80 - 100) / 100 * 100 = -20%', () => {
      expect(compareIndicators(80, 100, 'PERCENTAGE_CHANGE')).toBe(-20)
    })

    test('(150 - 100) / 100 * 100 = 50%', () => {
      expect(compareIndicators(150, 100, 'PERCENTAGE_CHANGE')).toBe(50)
    })

    test('Division by zero returns null', () => {
      expect(compareIndicators(100, 0, 'PERCENTAGE_CHANGE')).toBeNull()
    })
  })

  describe('RATIO operator', () => {
    test('150 / 50 = 3', () => {
      expect(compareIndicators(150, 50, 'RATIO')).toBe(3)
    })

    test('100 / 25 = 4', () => {
      expect(compareIndicators(100, 25, 'RATIO')).toBe(4)
    })

    test('50 / 100 = 0.5', () => {
      expect(compareIndicators(50, 100, 'RATIO')).toBe(0.5)
    })

    test('Division by zero returns null', () => {
      expect(compareIndicators(100, 0, 'RATIO')).toBeNull()
    })
  })

  describe('GREATER_THAN operator', () => {
    test('90 > 85 = true', () => {
      expect(compareIndicators(90, 85, 'GREATER_THAN')).toBe(true)
    })

    test('80 > 90 = false', () => {
      expect(compareIndicators(80, 90, 'GREATER_THAN')).toBe(false)
    })

    test('100 > 100 = false', () => {
      expect(compareIndicators(100, 100, 'GREATER_THAN')).toBe(false)
    })
  })

  describe('LESS_THAN operator', () => {
    test('85 < 90 = true', () => {
      expect(compareIndicators(85, 90, 'LESS_THAN')).toBe(true)
    })

    test('95 < 90 = false', () => {
      expect(compareIndicators(95, 90, 'LESS_THAN')).toBe(false)
    })

    test('100 < 100 = false', () => {
      expect(compareIndicators(100, 100, 'LESS_THAN')).toBe(false)
    })
  })

  describe('EQUAL operator', () => {
    test('100 = 100 = true', () => {
      expect(compareIndicators(100, 100, 'EQUAL')).toBe(true)
    })

    test('100 = 99 = false', () => {
      expect(compareIndicators(100, 99, 'EQUAL')).toBe(false)
    })
  })

  describe('Edge cases', () => {
    test('Invalid valueA returns null', () => {
      expect(compareIndicators('abc', 100, 'DIFFERENCE')).toBeNull()
    })

    test('Invalid valueB returns null', () => {
      expect(compareIndicators(100, 'xyz', 'DIFFERENCE')).toBeNull()
    })

    test('Both invalid values return null', () => {
      expect(compareIndicators('abc', 'xyz', 'DIFFERENCE')).toBeNull()
    })

    test('Null values return null', () => {
      expect(compareIndicators(null, 100, 'DIFFERENCE')).toBeNull()
    })

    test('Undefined values return null', () => {
      expect(compareIndicators(undefined, 100, 'DIFFERENCE')).toBeNull()
    })

    test('Unknown operator returns null', () => {
      expect(compareIndicators(100, 50, 'UNKNOWN_OPERATOR')).toBeNull()
    })

    test('String numbers are converted correctly', () => {
      expect(compareIndicators('100', '50', 'DIFFERENCE')).toBe(50)
    })
  })
})

describe('formatComparisonResult', () => {
  test('PERCENTAGE_CHANGE formats with 1 decimal', () => {
    expect(formatComparisonResult(20.567, 'PERCENTAGE_CHANGE')).toBe('20.6%')
  })

  test('RATIO formats with 2 decimals', () => {
    expect(formatComparisonResult(3.4567, 'RATIO')).toBe('3.46')
  })

  test('DIFFERENCE formats as integer', () => {
    expect(formatComparisonResult(25.7, 'DIFFERENCE')).toBe('26')
  })

  test('GREATER_THAN true formats as "Yes"', () => {
    expect(formatComparisonResult(true, 'GREATER_THAN')).toBe('Yes')
  })

  test('GREATER_THAN false formats as "No"', () => {
    expect(formatComparisonResult(false, 'GREATER_THAN')).toBe('No')
  })

  test('LESS_THAN true formats as "Yes"', () => {
    expect(formatComparisonResult(true, 'LESS_THAN')).toBe('Yes')
  })

  test('EQUAL true formats as "Yes"', () => {
    expect(formatComparisonResult(true, 'EQUAL')).toBe('Yes')
  })

  test('Null result formats as "N/A"', () => {
    expect(formatComparisonResult(null, 'DIFFERENCE')).toBe('N/A')
  })

  test('Undefined result formats as "N/A"', () => {
    expect(formatComparisonResult(undefined, 'PERCENTAGE_CHANGE')).toBe('N/A')
  })

  test('Unknown operator returns string representation', () => {
    expect(formatComparisonResult(123.45, 'UNKNOWN')).toBe('123.45')
  })
})

describe('getOperatorDescription', () => {
  test('DIFFERENCE returns correct description', () => {
    expect(getOperatorDescription('DIFFERENCE')).toBe('Difference (A - B)')
  })

  test('PERCENTAGE_CHANGE returns correct description', () => {
    expect(getOperatorDescription('PERCENTAGE_CHANGE')).toBe('Percentage Change ((A-B)/B * 100)')
  })

  test('RATIO returns correct description', () => {
    expect(getOperatorDescription('RATIO')).toBe('Ratio (A / B)')
  })

  test('GREATER_THAN returns correct description', () => {
    expect(getOperatorDescription('GREATER_THAN')).toBe('A > B')
  })

  test('LESS_THAN returns correct description', () => {
    expect(getOperatorDescription('LESS_THAN')).toBe('A < B')
  })

  test('EQUAL returns correct description', () => {
    expect(getOperatorDescription('EQUAL')).toBe('A = B')
  })

  test('Unknown operator returns operator itself', () => {
    expect(getOperatorDescription('UNKNOWN')).toBe('UNKNOWN')
  })
})
