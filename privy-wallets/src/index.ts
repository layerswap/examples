import 'dotenv/config';
import {randomUUID} from 'node:crypto';
import {PrivyClient} from '@privy-io/node';
import {createPublicClient, http} from 'viem';
import {demoEnv, getSourceChain} from './lib/env.js';
import {
  buildSubmissionCalls,
  createExampleSummary,
  createFundingSummary,
  createLayerswapSwap,
  getOrCreateWallet,
  lookupSwapByTransactionHash,
  printJson,
  readAllowanceSnapshot,
  submitSponsoredCalls,
  toErrorMessage,
} from './lib/example.js';
import {LayerswapClient} from './lib/layerswap.js';

const sourceChain = getSourceChain();
const sourceCaip2 = `eip155:${sourceChain.id}` as const;
const publicClient = createPublicClient({
  chain: sourceChain,
  transport: http(demoEnv.rpcUrl),
});
const layerswapClient = new LayerswapClient(
  demoEnv.layerswapApiBaseUrl,
  demoEnv.layerswapApiKey,
);
const privyClient = new PrivyClient({
  appId: demoEnv.privyAppId,
  appSecret: demoEnv.privyAppSecret,
});

void main().catch((error) => {
  console.error(`\n[error] ${toErrorMessage(error)}`);
  process.exitCode = 1;
});

async function main(): Promise<void> {
  // Read this file first. The lower-level mechanics live in ./lib/example.ts.
  const wallet = await getOrCreateWallet(
    privyClient,
    demoEnv.wallet,
    demoEnv.walletLabelPrefix,
  );
  const {preparedSwap, depositAction} = await createLayerswapSwap(
    layerswapClient,
    wallet,
    {
      sourceNetwork: demoEnv.sourceNetwork,
      sourceToken: demoEnv.sourceToken,
      destinationNetwork: demoEnv.destinationNetwork,
      destinationToken: demoEnv.destinationToken,
      amount: demoEnv.amount,
      referenceId: `privy-layerswap-${randomUUID().slice(0, 8)}`,
    },
  );
  const allowance = await readAllowanceSnapshot(
    publicClient,
    wallet,
    preparedSwap,
    depositAction,
  );

  if (allowance.balance < allowance.requiredAmount) {
    printJson(createFundingSummary({
      wallet,
      allowance,
      sourceNetwork: demoEnv.sourceNetwork,
      sourceToken: demoEnv.sourceToken,
    }));
    return;
  }

  const calls = buildSubmissionCalls(preparedSwap, depositAction, allowance);
  const submission = await submitSponsoredCalls(privyClient, wallet, {
    sourceCaip2,
    sponsor: demoEnv.privySponsorTransactions,
    pollIntervalMs: demoEnv.privyPollIntervalMs,
    pollTimeoutSeconds: demoEnv.privyPollTimeoutSeconds,
    calls: calls.calls,
    batchedApproval: calls.batchedApproval,
    approvalAmount: calls.approvalAmount,
  });
  const lookup = await lookupSwapByTransactionHash(
    layerswapClient,
    submission.outerTransactionHash,
  );

  printJson(createExampleSummary({
    wallet,
    sourceNetwork: demoEnv.sourceNetwork,
    sourceToken: demoEnv.sourceToken,
    destinationNetwork: demoEnv.destinationNetwork,
    destinationToken: demoEnv.destinationToken,
    requestedAmount: demoEnv.amount,
    swapId: preparedSwap.swap.id,
    sequenceNumber: preparedSwap.swap.metadata.sequence_number,
    referenceId: preparedSwap.swap.metadata.reference_id ?? null,
    depositTarget: depositAction.to_address,
    allowance,
    submission,
    lookup,
  }));
}
