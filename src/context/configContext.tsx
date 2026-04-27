import { createContext, useContext } from "react";
import type { Config } from "../config";

export const ConfigContext = createContext<Config | null>(null);

export const useConfig = () => {
	const config = useContext(ConfigContext);

	if (config === null) {
		throw new Error("useConfig must be used within ConfigContext.");
	}

	return config;
};
