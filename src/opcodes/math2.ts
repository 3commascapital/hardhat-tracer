import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item } from "../types";
import { colorLabel, colorMath } from "../utils";

export interface MATH {
  a: bigint | `0x${string}` | boolean;
  b: bigint | `0x${string}` | boolean;
  c: bigint | `0x${string}` | boolean;
}

const operators = {
  ADD: '+',
  SUB: '-',
  MUL: '*',
  DIV: '/',
  SDIV: '/',
  MOD: '%',
  SMOD: '%',
  EXP: '**',
  LT: '<',
  SLT: '<',
  GT: '>',
  SGT: '>',
  EQ: '==',
  AND: '&',
  OR: '|',
  XOR: '^',
  NOT: '~',
} as const

export type Math2Opcode = keyof typeof operators
export const ops = new Set<Math2Opcode>(
  Object.keys(operators) as Math2Opcode[]
)

const truthyOpcodesList = [
  'LT',
  'GT',
  'SLT',
  'SGT',
  'EQ',
] as const
export type TruthyOpcode = typeof truthyOpcodesList[number]
const truthyOpcodes = new Set<TruthyOpcode>(truthyOpcodesList)

const bestAsHexList = [
  'AND',
  'OR',
  'XOR',
  'NOT',
  // even though these start with s, they should never
  // get to the OpChecker type below so we
  // don't have to worry about negative shifting
  'SHL',
  'SHR',
  'SAR',
] as const
export type BestAsHexOpcode = typeof bestAsHexList[number]
const bestAsHex = new Set<BestAsHexOpcode>(bestAsHexList)

type OpChecker = (a: bigint, b: bigint, c: bigint, op: Math2Opcode) => boolean

const operatorIsSigned = (op: Math2Opcode) => (
  op.startsWith('S') && op !== 'SUB'
)
const toBool = (n: bigint) => BigInt(n) === 1n

const divOperation: OpChecker = (a, b, c, op) => (
  (!operatorIsSigned(op) || (a < 0n || b < 0n)) &&
  (((a / b) === c) || (BigInt.asUintN(256, a / b) === c))
)
const ltOperation: OpChecker = (a, b, c, op) => (
  (!operatorIsSigned(op) || (a < 0n || b < 0n)) &&
  ((a < b) === toBool(c))
)
const gtOperation: OpChecker = (a, b, c, op) => (
  (!operatorIsSigned(op) || (a < 0n || b < 0n)) &&
  ((a > b) === toBool(c))
)
const modOperation: OpChecker = (a, b, c, op) => (
  (!operatorIsSigned(op) || (a < 0n || b < 0n)) &&
  ((a % b === c) || BigInt.asUintN(256, a % b) === c)
)
const operations = new Map<Math2Opcode, OpChecker>([
  ['ADD', (a, b, c) => (
    a + b === c || BigInt.asUintN(256, a + b) === c
  )],
  ['SUB', (a, b, c) => (
    a - b === c || BigInt.asUintN(256, a - b) === c
  )],
  ['MUL', (a, b, c) => (
    a * b === c || BigInt.asUintN(256, a * b) === c
  )],
  ['DIV', divOperation],
  ['SDIV', divOperation],
  ['LT', ltOperation],
  ['SLT', ltOperation],
  ['GT', gtOperation],
  ['SGT', gtOperation],
  ['MOD', modOperation],
  ['SMOD', modOperation],
  ['EXP', (a, b, c) => (
    (a ** b === c) || BigInt.asUintN(256, a ** b) === c
  )],
  ['EQ', (a, b, c) => ((a === b) === toBool(c))],
])

const checkOperation = (
  opcode: Math2Opcode,
  a: bigint, b: bigint, c: bigint,
  debug: boolean = false, count = 0,
): MATH => {
  let negA = -a
  let negB = -b
  let negC = -c
  if (debug) {
    console.log({ a, b, c, negA, negB, negC })
  }
  const op = operations.get(opcode)!
  if (op(a, b, c, opcode)) return { a, b, c }
  else if (op(a, negB, c, opcode)) return { a, b: negB, c }
  else if (op(negA, b, c, opcode)) return { a: negA, b, c }
  else if (op(negA, negB, c, opcode)) return { a: negA, b: negB, c }
  else if (op(a, b, negC, opcode)) return { a, b, c: negC }
  else if (op(a, negB, negC, opcode)) return { a, b: negB, c: negC }
  else if (op(negA, b, negC, opcode)) return { a: negA, b, c: negC }
  else if (op(negA, negB, negC, opcode)) return { a: negA, b: negB, c: negC }
  if (count === 1) {
    throw new Error('unable to compute')
  } else {
    negA = BigInt.asUintN(256, negA)
    negB = BigInt.asUintN(256, negB)
    negC = BigInt.asUintN(256, negC)
    return checkOperation(opcode, negA, negB, negC, debug, ++count)
  }
}

const closestTo0 = (x: bigint) => {
  const negX = BigInt.asUintN(256, -x)
  return x < negX ? x : -negX
}

const asHex = (a: bigint, b: bigint, c: bigint) => ({
  a: `0x${a.toString(16)}`,
  b: `0x${b.toString(16)}`,
  c: `0x${c.toString(16)}`,
} as const)

function parse(step: MinimalInterpreterStep): AwaitedItem<MATH> {
  const { stack, opcode } = step
  const len = stack.length
  let b = stack[len - 2]
  let a = stack[len - 1]
  return {
    isAwaitedItem: true,
    next: 1,
    parse: (stepNext: MinimalInterpreterStep) => {
      const c = stepNext.stack[stepNext.stack.length - 1]
      // assume that numbers close to 0 are going to be
      // what is actually being used / most useful to viewers
      // might be worth putting this or even the entirity
      // of hex->bigint conversion behind a flag
      const loA = closestTo0(a)
      const loB = closestTo0(b)
      const loC = closestTo0(c)
      let params!: MATH
      if (bestAsHex.has(opcode.name as BestAsHexOpcode)) {
        params = asHex(a, b, c)
      } else {
        try {
          params = checkOperation(
            opcode.name as Math2Opcode,
            loA, loB, loC,
          )
        } catch (err) {
          // console.log({
          //   opcode: opcode.name,
          //   a, b, c,
          //   loA, loB, loC,
          // })
          params = asHex(a, b, c)
        }
      }
      if (truthyOpcodes.has(opcode.name as any)) {
        params.c = toBool(params.c as bigint)
      }


      return {
        opcode: opcode.name,
        params,
        format(): string {
          return format(this);
        },
      }
    },
  };
}

const equalColorized = colorMath('=')

function format(item: Item<MATH>): string {
  return `${colorLabel(`[${item.opcode}]`)}${' '.repeat(7 - item.opcode.length)}${item.params.a} ${colorMath(operators[item.opcode as Math2Opcode])
    } ${item.params.b} ${equalColorized} ${item.params.c}`;
}

export { parse, format };
