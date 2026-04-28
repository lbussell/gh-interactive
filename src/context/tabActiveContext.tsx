import { createContext, useContext } from "react";

export const TabActiveContext = createContext(true);

export function useTabActive(): boolean {
	return useContext(TabActiveContext);
}
