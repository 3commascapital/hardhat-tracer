import { MinimalInterpreterStep } from "hardhat/internal/hardhat-network/provider/vm/types";

import { AwaitedItem, Item } from "../types";
import { colorLabel, colorMath } from "../utils";
import { constants } from "ethers";

export interface MATH {
  a: bigint;
  b: bigint;
  c: bigint;
}

const operatorFromOpcode = new Map<string, string>([
  ['ADD', '+'],
  ['SUB', '-'],
  ['MUL', '*'],
  ['DIV', '/'],
])

const maxUint256 = constants.MaxUint256.toBigInt()

function parse(step: MinimalInterpreterStep): AwaitedItem<MATH> {
  const { stack, opcode } = step
  const len = stack.length
  let b = stack[len - 2]
  let a = stack[len - 1]
  return {
    isAwaitedItem: true,
    next: 1,
    parse: (stepNext: MinimalInterpreterStep) => {
      let c = stepNext.stack[stepNext.stack.length - 1]
      if ((opcode.name === 'ADD' || opcode.name === 'SUB') && b > a && c < b) {
        b = -(maxUint256 - b + 1n)
      }
      return {
        opcode: opcode.name,
        params: { a, b, c },
        format(): string {
          return format(this);
        },
      }
    },
  };
}

function format(item: Item<MATH>): string {
  return `${colorLabel(`[${item.opcode}]`)}    ${colorMath(item.params.a)} ${operatorFromOpcode.get(item.opcode)} ${colorMath(item.params.b)} = ${item.params.c}`;
}

export default { parse, format };
