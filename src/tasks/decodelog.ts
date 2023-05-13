import { BigNumber, ethers } from "ethers";
import { task } from "hardhat/config";

import { formatLog } from "../format/log";
import { addCliParams } from "../utils";
import { hexZeroPad, isHexString } from "ethers/lib/utils";

addCliParams(task("decodelog", "Decodes log data"))
  .addOptionalParam("data", "data if any")
  .addVariadicPositionalParam("topics", "list of topics if any")
  .setAction(async (args, hre) => {
    const td = {
      artifacts: hre.artifacts,
      tracerEnv: hre.tracer,
      provider: hre.network.provider,
      nameTags: hre.tracer.nameTags,
    };

    // see if the data is a log
    const formattedlog = await formatLog(
      {
        data: args.data ?? "0x",
        topics: args.topics.map(parseTopic),
      },
      ethers.constants.AddressZero,
      td
    );

    console.log(formattedlog);
  });

// input can be a number string otherwise hex string
function parseTopic(input: string) {
  let hex = isHexString(input) ? input : BigNumber.from(input).toHexString();
  return hexZeroPad(hex, 32);
}
