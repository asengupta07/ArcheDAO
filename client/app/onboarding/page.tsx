'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Beams from '@/components/ui/beams';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network as AptosNetwork } from '@aptos-labs/ts-sdk';
import { toast } from '@/hooks/use-toast';
import { WalletSelector } from '@/components/WalletSelector';
import { AlertCircle } from 'lucide-react';

// Contract information from environment variables
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '';
const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || '';

export default function OnboardingPage() {
  const { account, connected, network, wallet, signAndSubmitTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    governors: '',
    stakedAmount: '',
    communityVotingPower: 50,
    active: true,
    nativeToken: ''
  });

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Portal Details', description: 'Basic information about your portal' },
    { title: 'Governance', description: 'Configure voting and governance settings' },
    { title: 'Finalization', description: 'Review and create your portal' }
  ];



  // Initialize Aptos client for devnet
  useEffect(() => {
    const config = new AptosConfig({
      network: AptosNetwork.DEVNET,
    });
    setAptosClient(new Aptos(config));
  }, []);



  // Create a portal
  const createPortal = async () => {
    if (!aptosClient || !account) return;

    try {
      setIsLoading(true);

      const transaction: any = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_portal_simple`,
          functionArguments: [
            formData.name,
            formData.description,
            formData.communityVotingPower,
          ],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "Portal Created",
        description: "Your portal has been created successfully on the Aptos network.",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        governors: '',
        stakedAmount: '',
        communityVotingPower: 50,
        active: true,
        nativeToken: ''
      });
      setCurrentStep(0);

    } catch (error) {
      console.error("Error creating portal:", error);
      toast({
        title: "Portal Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create portal.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create portal on final step
      createPortal();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      communityVotingPower: parseInt(e.target.value)
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 1:
        return formData.stakedAmount.trim() !== '';
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-white font-medium">Portal Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter portal name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200 resize-none"
                placeholder="Describe your portal's purpose and vision"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">Native Token (Optional)</label>
              <input
                type="text"
                name="nativeToken"
                value={formData.nativeToken}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter native token symbol"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-white font-medium">Governors</label>
              <input
                type="text"
                name="governors"
                value={formData.governors}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter governor addresses (comma-separated)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">Staked Amount</label>
              <input
                type="number"
                name="stakedAmount"
                value={formData.stakedAmount}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter staked amount"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-white font-medium">
                Community Voting Power: {formData.communityVotingPower}%
              </label>
              <div className="relative">
                <input
                  type="range"
                  name="communityVotingPower"
                  min="0"
                  max="100"
                  value={formData.communityVotingPower}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${formData.communityVotingPower}%, rgba(255,255,255,0.1) ${formData.communityVotingPower}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="w-5 h-5 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
              />
              <label className="text-white font-medium">Active Portal</label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Review Your Portal</h3>
              <p className="text-white/70">Please review the information before creating your portal</p>
            </div>

            <div className="grid gap-4">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Portal Name</span>
                    <span className="text-white font-medium">{formData.name}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-white/70">Description</span>
                    <span className="text-white font-medium text-right max-w-xs">{formData.description}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Staked Amount</span>
                    <span className="text-white font-medium">{formData.stakedAmount}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Voting Power</span>
                    <span className="text-white font-medium">{formData.communityVotingPower}%</span>
                  </div>
                </CardContent>
              </Card>

              {formData.nativeToken && (
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Native Token</span>
                      <span className="text-white font-medium">{formData.nativeToken}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Beams */}
      <div className="fixed inset-0 z-0">
        <Beams
          beamWidth={2}
          beamHeight={32}
          beamNumber={20}
          lightColor="#ff0000"
          speed={5}
          noiseIntensity={2}
          scale={0.2}
          rotation={135}
          beamSpacing={0}
        />
      </div>

      {/* Navbar */}

      {/* Main Content */}
      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Create Portal
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Establish your governance portal in the ArcheDAO ecosystem. 
                Configure voting rules, governance structure, and community parameters.
              </p>
              {!connected && (
                <div className="flex justify-center mb-8">
                  <WalletSelector />
                </div>
              )}
            </div>



            {/* Show form only if connected */}
            {!connected && (
              <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="flex flex-col items-center justify-center p-12 gap-4">
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                  <h2 className="text-xl font-medium text-white">Connect Your Wallet</h2>
                  <p className="text-center text-white/70">
                    Please connect your wallet to create a portal
                  </p>
                  <WalletSelector />
                </CardContent>
              </Card>
            )}

            {connected && (
              <>
                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                  <div className="flex items-center space-x-4">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                          index <= currentStep 
                            ? 'bg-red-600 border-red-600 text-white' 
                            : 'border-white/20 text-white/50'
                        }`}>
                          {index + 1}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={`w-16 h-0.5 mx-2 transition-all duration-200 ${
                            index < currentStep ? 'bg-red-600' : 'bg-white/20'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Card */}
                <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">
                      {steps[currentStep].title}
                    </CardTitle>
                    <CardDescription className="text-white/70">
                      {steps[currentStep].description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {renderStepContent()}

                      {/* Navigation Buttons */}
                      <div className="flex justify-between pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                          className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        
                        <Button
                          type="submit"
                          disabled={!isStepValid() || isLoading}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-red-500/25 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                        >
                          {isLoading ? 'Processing...' : (currentStep === steps.length - 1 ? 'Create Portal' : 'Next')}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ff0000;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ff0000;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
