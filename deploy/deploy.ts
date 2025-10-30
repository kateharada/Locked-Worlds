import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedLockedWorlds = await deploy("LockedWorlds", {
    from: deployer,
    log: true,
  });

  console.log(`LockedWorlds contract: `, deployedLockedWorlds.address);
};
export default func;
func.id = "deploy_lockedWorlds"; // id required to prevent reexecution
func.tags = ["LockedWorlds"];
