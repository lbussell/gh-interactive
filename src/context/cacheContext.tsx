import { createContext, useContext } from "react";

export const CacheDirContext = createContext<string | null>(null);

export const useCacheDir = () => {
	const cacheDir = useContext(CacheDirContext);

	if (cacheDir === null) {
		throw new Error("useCacheDir must be used within CacheDirContext.");
	}

	return cacheDir;
};
