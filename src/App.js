import './App.css';
import { useState } from 'react';
import SwapDialog from './SwapDialog';

function App() {
  const [showWidget, setShowWidget] = useState(false);
  const [amountData, setAmountData] = useState();
  const [amountField, setAmountField] = useState('');
  const [addressField, setAddressField] = useState('');
  const [showSwapDialog, setShowSwapDialog] = useState(false);

  const handleAmountChange = (event) => {
    setAmountField(event.target.value);
  };

  const handleAddressChange = (event) => {
    setAddressField(event.target.value);
  };

  const handleDeposit = async () => {
    setShowWidget(true);
    try {
      const payload = {
        destination: "ARBITRUM_MAINNET",
        destination_asset: "USDC.e",
        refuel: false,
        source: "ETHEREUM_MAINNET",
        source_asset: "USDC"
      };
      const response = await fetch('https://api.layerswap.io/api/swap_rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      setAmountData(data?.data)
      console.log('Fetched data:', data);

      return data;
    } catch (error) {
      console.error('Error fetching data:', error.message);
      throw error;
    }
  }
  const maxAmount = amountData?.max_amount;
  const minAmount = amountData?.min_amount;

  const ethLogo = '/ethereum_mainnet.png'
  const arbitrumLogo = '/arbitrum_mainnet.png'

  return (
    <div className="App h-screen flex items-center justify-center">
      <div className="top-backdrop"></div>
      {!showWidget ?
        <button
          type="button"
          onClick={() => handleDeposit()}
          className="rounded-md bg-[#ff0093] px-3.5 py-2.5 w-44 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Deposit
        </button>
        :
        null
      }
      {showWidget ? (
        <div class="md:shadow-card rounded-lg w-full sm:overflow-hidden relative max-w-md text-white text-left bg-[#0e1426]">
          <div class="relative px-6">
            <div class="flex items-start">
              <div class="flex flex-nowrap grow">
                <div class="w-full py-6 flex flex-col justify-between space-y-5 text-secondary-text h-full sm:min-h-[504px]">
                  <button
                    className="text-white background-transparent font-bold uppercase text-sm outline-none focus:outline-none mr-1 ease-linear transition-all duration-150 text-end absolute top-2 right-2"
                    type="button"
                    onClick={() => setShowWidget(false)}
                  >
                    X
                  </button>
                  <form action="#" class="h-full pointer-events-auto ">
                    <div class="space-y-4 pb-3">
                      <div class="flex-col relative flex justify-between w-full space-y-0.5 mb-3.5 leading-4">
                        <div class="flex flex-col w-full">
                          <div class="p-3 bg-secondary-700 border border-secondary-500 rounded-t-lg pb-5">
                            <label for="from" class="block font-semibold text-secondary-text text-xs">From</label>
                            <div class="mt-1.5 grid grid-flow-row-dense grid-cols-8 md:grid-cols-6 items-center pr-2">
                              <div class="col-span-5 md:col-span-4">
                                <div class="flex items-center relative">
                                  <button type="button" class="rounded-lg focus-peer:ring-primary focus-peer:border-secondary-400 focus-peer:border focus-peer:ring-1 focus:outline-none disabled:cursor-not-allowed relative grow h-12 flex items-center text-left justify-bottom w-full pl-3 pr-2 py-2 bg-secondary-600 border border-secondary-500 font-semibold">
                                    <img src={ethLogo} width={20} height={20} alt="From" className='rounded-md mr-1' />
                                    <span class="flex grow text-left items-center text-xs md:text-base"><span class="block font-medium text-primary-text-placeholder flex-auto items-center">Ethereum</span></span>
                                  </button>
                                </div>
                              </div>
                              <div class="col-span-3 md:col-span-2 w-full ml-2">
                                <div class="relative">
                                  <div class="rounded-lg focus-peer:ring-primary focus-peer:border-secondary-400 focus-peer:border focus-peer:ring-1 focus:outline-none disabled:cursor-not-allowed relative grow h-12 flex items-center text-left justify-bottom w-full pl-3 pr-2 py-2 bg-secondary-600 border border-secondary-500 font-semibold align-sub ">
                                    <div class="disabled:cursor-not-allowed relative grow flex items-center text-left w-full font-semibold">
                                      <img src={ethLogo} width={20} height={20} alt="From" className='rounded-md mr-1' />
                                      <span class="flex grow text-left items-center"><span class="block text-xs md:text-base font-medium text-primary-text-placeholder flex-auto items-center">ETH</span></span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="flex flex-col w-full">
                          <div class="p-3 bg-secondary-700 border border-secondary-500 rounded-b-lg">
                            <label for="to" class="block font-semibold text-secondary-text text-xs">To</label>
                            <div class="mt-1.5 grid grid-flow-row-dense grid-cols-8 md:grid-cols-6 items-center pr-2">
                              <div class="col-span-5 md:col-span-4">
                                <div class="flex items-center relative">
                                  <button type="button" class="rounded-lg focus-peer:ring-primary focus-peer:border-secondary-400 focus-peer:border focus-peer:ring-1 focus:outline-none disabled:cursor-not-allowed relative grow h-12 flex items-center text-left justify-bottom w-full pl-3 pr-2 py-2 bg-secondary-600 border border-secondary-500 font-semibold">
                                    <img src={arbitrumLogo} width={20} height={20} alt="From" className='rounded-md mr-1' />
                                    <span class="flex grow text-left items-center text-xs md:text-base"><span class="block font-medium text-primary-text-placeholder flex-auto items-center">Arbitrum one</span></span>
                                  </button>
                                </div>
                              </div>
                              <div class="col-span-3 md:col-span-2 w-full ml-2">
                                <div class="relative">
                                  <div class="rounded-lg focus-peer:ring-primary focus-peer:border-secondary-400 focus-peer:border focus-peer:ring-1 focus:outline-none disabled:cursor-not-allowed relative grow h-12 flex items-center text-left justify-bottom w-full pl-3 pr-2 py-2 bg-secondary-600 border border-secondary-500 font-semibold align-sub ">
                                    <div class="disabled:cursor-not-allowed relative grow flex items-center text-left w-full font-semibold">
                                      <img src={ethLogo} width={20} height={20} alt="From" className='rounded-md mr-1' />
                                      <span class="flex grow text-left items-center"><span class="block text-xs md:text-base font-medium text-primary-text-placeholder flex-auto items-center">ETH</span></span></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="mb-6 leading-4">
                        <p class="block font-semibold text-secondary-text text-xs mb-1">Amount</p>
                        <div class="flex w-full justify-between bg-secondary-700 rounded-lg">
                          <div class="relative w-full">
                            <div>
                              <div class="flex relative w-full">
                                <input
                                  name="amount"
                                  pattern="^[0-9]*[.,]?[0-9]*$"
                                  inputmode="decimal"
                                  autocomplete="off"
                                  placeholder={`${minAmount && maxAmount ? minAmount + ' - ' + maxAmount : '0 - 1'}`}
                                  autocorrect="off"
                                  max="0"
                                  type="text"
                                  step="0.1"
                                  id="amount"
                                  class="disabled:cursor-not-allowed pl-3 h-12 leading-4 shadow-sm border-secondary-500 placeholder:text-primary-text-placeholder bg-secondary-700 focus:ring-primary focus:border-primary block min-w-0 rounded-lg font-semibold border-0 text-primary-text pr-0 w-full"
                                  value={amountField}
                                  onChange={handleAmountChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="mb-6 leading-4">
                        <p class="block font-semibold text-secondary-text text-xs mb-1">To address</p>
                        <div class="flex w-full justify-between bg-secondary-700 rounded-lg">
                          <div class="relative w-full">
                            <div>
                              <div class="flex relative w-full">
                                <input
                                  name="amount"
                                  pattern="^[0-9]*[.,]?[0-9]*$"
                                  inputmode="decimal"
                                  autocomplete="off"
                                  placeholder="Enter your address here"
                                  autocorrect="off"
                                  max="0"
                                  type="text"
                                  step="0.1"
                                  id="amount"
                                  class="disabled:cursor-not-allowed pl-3 h-12 leading-4 shadow-sm border-secondary-500 placeholder:text-primary-text-placeholder bg-secondary-700 focus:ring-primary focus:border-primary block min-w-0 rounded-lg font-semibold border-0 text-primary-text pr-0 w-full"
                                  value={addressField}
                                  onChange={handleAddressChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="w-full">
                        <div class="relative overflow-hidden">
                          <div class="undefined">
                            <div class="flex flex-col divide-y-2 divide-secondary-900 rounded-lg bg-secondary-700 overflow-hidden text-sm">
                              <div class="gap-4 flex relative items-center outline-none w-full text-primary-text px-4 py-3">
                                <div class="flex items-start justify-between w-full">
                                  <span class="md:font-semibold text-sm md:text-base text-primary-buttonTextColor leading-8 md:leading-8 flex-1"><span>You will receive</span></span>
                                  <div class="flex items-end flex-col"><span class="text-sm md:text-base">{amountField.trim() && amountData?.fee_amount ? (amountField - amountData?.fee_amount).toFixed(5) : '-'}</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="text-primary-text text-base mt-3 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0  max-sm:z-30 max-sm:bg-secondary-900  max-sm:shadow-widget-footer  max-sm:p-4  max-sm:px-6  max-sm:w-full ">
                      <button
                        type="submit"
                        onClick={() => setShowSwapDialog(true)}
                        disabled={!amountField.trim() || !addressField.trim()}
                        class="border border-primary disabled:border-primary-900 items-center space-x-1 disabled:text-opacity-40 disabled:bg-primary-900 disabled:cursor-not-allowed relative w-full flex justify-center font-semibold rounded-md transform hover:brightness-125 transition duration-200 ease-in-out bg-primary text-primary-actionButtonText py-3 px-2 md:px-3 plausible-event-name=Swap+initiated"
                      >
                        <span class="order-first absolute left-0 inset-y-0 flex items-center pl-3"></span>
                        <span class="grow text-center">Create swap</span>
                      </button>
                    </div>
                    <div class="text-primary-text text-base mt-3 max-sm:inset-x-0 max-sm:bottom-0 max-sm:p-4 max-sm:w-full invisible sm:hidden"></div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {showSwapDialog &&
        <SwapDialog open={showSwapDialog} toggleOpen={setShowSwapDialog} address={addressField} />
      }
    </div>
  );
}

export default App;
