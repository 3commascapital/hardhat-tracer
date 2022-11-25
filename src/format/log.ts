import { colorContract, colorEvent } from "../colors";
import { EventFragment, Result } from "ethers/lib/utils";
import { formatParam } from "./param";
import { formatResult } from "./result";
import { getBetterContractName } from "../utils";
import { TracerDependencies } from "../types";

export async function formatLog(
  log: { data: string; topics: string[] },
  currentAddress: string | undefined,
  dependencies: TracerDependencies
) {
  let fragment: EventFragment | undefined,
    result: Result | undefined,
    contractName: string | undefined;
  try {
    ({
      fragment,
      result,
      contractName,
    } = await dependencies.tracerEnv.decoder!.decodeEvent(
      log.topics,
      log.data
    ));

    // use just contract name
    contractName = contractName.split(":")[1];
  } catch {}

  // find a better contract name
  if (currentAddress) {
    const betterContractName = await getBetterContractName(
      currentAddress,
      dependencies
    );
    if (betterContractName) {
      contractName = betterContractName;
    } else if (contractName) {
      dependencies.tracerEnv.nameTags[currentAddress] = contractName;
    }
  }

  const firstPart = `${colorContract(
    contractName ? contractName : "UnknownContract"
  )}${
    dependencies.tracerEnv.showAddresses || !contractName
      ? `(${currentAddress})`
      : ""
  }`;

  const secondPart =
    fragment && result
      ? `${colorEvent(fragment.name)}(${formatResult(
          result,
          fragment.inputs,
          { decimals: -1, shorten: false },
          dependencies
        )})`
      : `${colorEvent("UnknownEvent")}(${formatParam(
          log.data,
          dependencies
        )}, ${formatParam(log.topics, dependencies)})`;

  return `${firstPart}.${secondPart}`;
}
