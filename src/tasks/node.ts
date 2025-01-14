import { TASK_NODE_GET_PROVIDER } from "hardhat/builtin-tasks/task-names";
import { subtask } from "hardhat/config";
import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  EIP1193Provider,
  HardhatRuntimeEnvironment,
  RequestArguments,
} from "hardhat/types";

import { addRecorder } from "../extend/hre";
import { ProviderLike } from "../types";
import { createTracerTask, getHardhatBaseProvider, runTask } from "../utils";
import { wrapTracer, wrapProvider } from "../wrapper";

createTracerTask("node").setAction(runTask);

subtask(TASK_NODE_GET_PROVIDER).setAction(async (args, hre, runSuper) => {
  const baseProvider = await runSuper(args);
  const wrappedProvider = wrapProvider(hre, new RpcWrapper(hre, baseProvider));
  wrapTracer(hre, wrappedProvider);

  addRecorder(hre).catch(console.error);
  return hre.network.provider;
});

class RpcWrapper extends ProviderWrapper {
  constructor(
    public hre: HardhatRuntimeEnvironment,
    public provider: ProviderLike
  ) {
    super((provider as unknown) as EIP1193Provider);
  }

  public async request({ method, params }: RequestArguments): Promise<unknown> {
    if (method === "tracer_lastTrace") {
      const trace = this.hre.tracer.lastTrace();
      if (trace === undefined) {
        throw new Error("No trace available");
      }
      return trace;
    } else if (method === "tracer_getTrace") {
      if (params && Array.isArray(params) && params.length === 1) {
        const trace = this.hre.tracer.recorder?.getTrace(params[0]);
        if (trace === undefined) {
          throw new Error("No trace available for provided txHash");
        }
        return trace;
      } else {
        throw new Error("Params should be [txHash]");
      }
    }
    return this.provider.send(method, params as any[]);
  }
}
