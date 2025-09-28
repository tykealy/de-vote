import hre from 'hardhat'
const { ethers } = await hre.network.connect()

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

// get function selectors from ABI
export function getSelectors (contract) {
  const signatures = []
  contract.interface.forEachFunction((func) => {
    signatures.push(func.format('full'))
  })
  
  const selectors = signatures.reduce((acc, val) => {
    if (val !== 'init(bytes)') {
      acc.push(contract.interface.getFunction(val).selector)
    }
    return acc
  }, [])
  
  // Attach properties as non-enumerable so they don't get serialized
  Object.defineProperty(selectors, 'contract', { value: contract, enumerable: false })
  Object.defineProperty(selectors, 'remove', { value: remove, enumerable: false })
  Object.defineProperty(selectors, 'get', { value: get, enumerable: false })
  
  return selectors
}

// get function selector from function signature
export function getSelector (func) {
  const abiInterface = new ethers.Interface([func])
  return abiInterface.getFunction(func).selector
}

// used with getSelectors to remove selectors from an array of selectors
// functionNames argument is an array of function signatures
function remove (functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === this.contract.interface.getFunction(functionName).selector) {
        return false
      }
    }
    return true
  })
  
  Object.defineProperty(selectors, 'contract', { value: this.contract, enumerable: false })
  Object.defineProperty(selectors, 'remove', { value: this.remove, enumerable: false })
  Object.defineProperty(selectors, 'get', { value: this.get, enumerable: false })
  
  return selectors
}

// used with getSelectors to get selectors from an array of selectors
// functionNames argument is an array of function signatures
function get (functionNames) {
  const selectors = this.filter((v) => {
    for (const functionName of functionNames) {
      if (v === this.contract.interface.getFunction(functionName).selector) {
        return true
      }
    }
    return false
  })
  
  Object.defineProperty(selectors, 'contract', { value: this.contract, enumerable: false })
  Object.defineProperty(selectors, 'remove', { value: this.remove, enumerable: false })
  Object.defineProperty(selectors, 'get', { value: this.get, enumerable: false })
  
  return selectors
}

// remove selectors using an array of signatures
export function removeSelectors (selectors, signatures) {
  const iface = new ethers.Interface(signatures.map(v => 'function ' + v))
  const removeSelectors = signatures.map(v => iface.getFunction(v).selector)
  selectors = selectors.filter(v => !removeSelectors.includes(v))
  return selectors
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets (facetAddress, facets) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}

export { remove }
