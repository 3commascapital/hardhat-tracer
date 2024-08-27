import hre from "hardhat";

import { wrapTracer } from "../../../../src/wrapper";
import { constants } from "ethers";

wrapTracer(hre, hre.network.provider);
hre.tracer.enabled = true;
hre.tracer.verbosity = 3;
[
  // 'ADD',
  // 'SUB',
  'MUL',
  'DIV',
  'SDIV',
].forEach((op) => hre.tracer.opcodes.add(op))

const {
  MaxInt256,
  MinInt256,
  MaxUint256,
} = constants

async function main() {
  hre.config.solidity.compilers[0].settings.enabled = false
  const opcodes = await hre.ethers.deployContract("OpCodes");

  try {
    console.log('addInt256')
    await opcodes.addInt256([
      1, 1, 2,
      1, -1, 0,
      -1, 1, 0,
      -1, -1, -2,
      MaxInt256.toBigInt(), 1, MinInt256.toBigInt(),
      MinInt256.toBigInt(), -1, MaxInt256.toBigInt(),
    ]);
    console.log('subInt256')
    await opcodes.subInt256([
      1, 1, 0,
      1, -1, 2,
      -1, 1, -2,
      -1, -1, 0,
      MaxInt256.toBigInt(), -1, MinInt256.toBigInt(),
      MinInt256.toBigInt(), 1, MaxInt256.toBigInt(),
    ]);
    console.log('mulInt256')
    await opcodes.mulInt256([
      1, 1, 1,
      1, -1, -1,
      -1, 1, -1,
      -1, -1, 1,
      MaxInt256.toBigInt(), -1, MinInt256.toBigInt() + 1n,
      MinInt256.toBigInt(), -1, MinInt256.toBigInt(), // this is fun
      MaxInt256.toBigInt(), 1, MaxInt256.toBigInt(),
      MinInt256.toBigInt(), 1, MinInt256.toBigInt(),
    ]);
    console.log('divInt256')
    await opcodes.divInt256([
      1, 1, 1,
      1, -1, -1,
      -1, 1, -1,
      -1, -1, 1,
      MaxInt256.toBigInt(), -1, MinInt256.toBigInt() + 1n,
      MinInt256.toBigInt(), -1, MinInt256.toBigInt(), // this is fun
    ]);
    console.log('divUint256')
    await opcodes.divUint256([
      2, 2, 1,
      MaxUint256.toBigInt(), MaxUint256.toBigInt(), 1n,
    ]);
  } catch (e) {
    console.log(e)
    console.log(hre.tracer.lastTrace()?.top?.params.exception);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main()
  .then(() => process.exit(0))
  .catch(console.error);
