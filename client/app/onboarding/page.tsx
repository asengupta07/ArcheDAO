"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Beams from "@/components/ui/beams";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Aptos,
  AptosConfig,
  Network as AptosNetwork,
} from "@aptos-labs/ts-sdk";
import { toast } from "@/hooks/use-toast";
import { WalletSelector } from "@/components/WalletSelector";
import { AlertCircle } from "lucide-react";

// Contract information from environment variables
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || "";
const MODULE_NAME = process.env.NEXT_PUBLIC_MODULE_NAME || "";

export default function OnboardingPage() {
  const { account, connected, network, wallet, signAndSubmitTransaction } =
    useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [aptosClient, setAptosClient] = useState<Aptos | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    governanceToken: "",
    minimumProposalThreshold: "100",
    votingPeriod: "7",
    executionDelay: "2",
    initialGovernors: "",
    proposalCreationFee: "10",
    taskCreationFee: "5",
    minimumVotingPower: "1",
    delegationEnabled: true,
    aiDelegatesEnabled: false,
    publicMembership: true,
    requireVerification: false,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "DAO Details", description: "Basic information about your DAO" },
    {
      title: "Governance Settings",
      description: "Configure voting and governance parameters",
    },
    {
      title: "Advanced Settings",
      description: "Configure advanced DAO features",
    },
    { title: "Finalization", description: "Review and create your DAO" },
  ];

  // Initialize Aptos client for devnet
  useEffect(() => {
    const config = new AptosConfig({
      network: AptosNetwork.DEVNET,
    });
    setAptosClient(new Aptos(config));
  }, []);

  // Create a DAO
  const createDAO = async () => {
    if (!aptosClient || !account) return;

    try {
      setIsLoading(true);

      // Parse governors string to vector of addresses
      const governors = (formData.initialGovernors || "")
        .split(",")
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0);

      const transaction: any = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_dao`,
          functionArguments: [
            formData.name,
            formData.description,
            formData.governanceToken,
            parseInt(formData.minimumProposalThreshold),
            parseInt(formData.votingPeriod) * 24 * 60 * 60, // Convert days to seconds
            parseInt(formData.executionDelay) * 24 * 60 * 60, // Convert days to seconds
            governors,
            parseInt(formData.proposalCreationFee),
            parseInt(formData.taskCreationFee),
            parseInt(formData.minimumVotingPower),
            formData.delegationEnabled,
            formData.aiDelegatesEnabled,
            formData.publicMembership,
            formData.requireVerification,
          ],
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      await aptosClient.waitForTransaction({ transactionHash: response.hash });

      toast({
        title: "DAO Created Successfully",
        description:
          "Your DAO has been created successfully on the Aptos network.",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        governanceToken: "",
        minimumProposalThreshold: "100",
        votingPeriod: "7",
        executionDelay: "2",
        initialGovernors: "",
        proposalCreationFee: "10",
        taskCreationFee: "5",
        minimumVotingPower: "1",
        delegationEnabled: true,
        aiDelegatesEnabled: false,
        publicMembership: true,
        requireVerification: false,
      });
      setCurrentStep(0);
    } catch (error) {
      console.error("Error creating DAO:", error);
      toast({
        title: "DAO Creation Failed",
        description:
          error instanceof Error ? error.message : "Failed to create DAO.",
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
      // Create DAO on final step
      createDAO();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.name.trim() !== "" && formData.description.trim() !== ""
        );
      case 1:
        return (
          formData.governanceToken.trim() !== "" &&
          formData.minimumProposalThreshold.trim() !== ""
        );
      case 2:
        return true;
      case 3:
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
              <label className="text-white font-medium">DAO Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter DAO name"
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
                placeholder="Describe your DAO's purpose and vision"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">Governance Token</label>
              <input
                type="text"
                name="governanceToken"
                value={formData.governanceToken}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter governance token symbol (e.g., GOV)"
                required
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-white font-medium">
                Minimum Proposal Threshold
              </label>
              <input
                type="number"
                name="minimumProposalThreshold"
                value={formData.minimumProposalThreshold}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Minimum tokens required to create proposals"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">
                Voting Period (days)
              </label>
              <input
                type="number"
                name="votingPeriod"
                value={formData.votingPeriod}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="How long voting stays open"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">
                Execution Delay (days)
              </label>
              <input
                type="number"
                name="executionDelay"
                value={formData.executionDelay}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Delay before executing passed proposals"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">
                Initial Governors
              </label>
              <input
                type="text"
                name="initialGovernors"
                value={formData.initialGovernors}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Enter governor addresses (comma-separated)"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-white font-medium">
                Proposal Creation Fee
              </label>
              <input
                type="number"
                name="proposalCreationFee"
                value={formData.proposalCreationFee}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Fee required to create proposals"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">
                Task Creation Fee
              </label>
              <input
                type="number"
                name="taskCreationFee"
                value={formData.taskCreationFee}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Fee required to create tasks"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white font-medium">
                Minimum Voting Power
              </label>
              <input
                type="number"
                name="minimumVotingPower"
                value={formData.minimumVotingPower}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none transition-all duration-200"
                placeholder="Minimum voting power required"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="delegationEnabled"
                  checked={formData.delegationEnabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <label className="text-white font-medium">
                  Enable Delegation
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="aiDelegatesEnabled"
                  checked={formData.aiDelegatesEnabled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <label className="text-white font-medium">
                  Enable AI Delegates
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="publicMembership"
                  checked={formData.publicMembership}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <label className="text-white font-medium">
                  Public Membership
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="requireVerification"
                  checked={formData.requireVerification}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                />
                <label className="text-white font-medium">
                  Require Verification
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Review Your DAO
              </h3>
              <p className="text-white/70">
                Please review the information before creating your DAO
              </p>
            </div>

            <div className="grid gap-4">
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">DAO Name</span>
                    <span className="text-white font-medium">
                      {formData.name}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-white/70">Description</span>
                    <span className="text-white font-medium text-right max-w-xs">
                      {formData.description}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Governance Token</span>
                    <span className="text-white font-medium">
                      {formData.governanceToken}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Voting Period</span>
                    <span className="text-white font-medium">
                      {formData.votingPeriod} days
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">
                      Min. Proposal Threshold
                    </span>
                    <span className="text-white font-medium">
                      {formData.minimumProposalThreshold}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Public Membership</span>
                    <span className="text-white font-medium">
                      {formData.publicMembership ? "Yes" : "No"}
                    </span>
                  </div>
                </CardContent>
              </Card>
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
                Create DAO
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
                Establish your decentralized autonomous organization in the
                ArcheDAO ecosystem. Configure governance rules, voting
                parameters, and community settings.
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
                  <h2 className="text-xl font-medium text-white">
                    Connect Your Wallet
                  </h2>
                  <p className="text-center text-white/70">
                    Please connect your wallet to create a DAO
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
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                            index <= currentStep
                              ? "bg-red-600 border-red-600 text-white"
                              : "border-white/20 text-white/50"
                          }`}
                        >
                          {index + 1}
                        </div>
                        {index < steps.length - 1 && (
                          <div
                            className={`w-16 h-0.5 mx-2 transition-all duration-200 ${
                              index < currentStep ? "bg-red-600" : "bg-white/20"
                            }`}
                          />
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
                          onClick={() =>
                            setCurrentStep(Math.max(0, currentStep - 1))
                          }
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
                          {isLoading
                            ? "Processing..."
                            : currentStep === steps.length - 1
                            ? "Create DAO"
                            : "Next"}
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
