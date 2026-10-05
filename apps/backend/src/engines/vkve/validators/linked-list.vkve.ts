import { ISceneGraph, IStateExecutionTrace, IVerificationIssue, IVerificationResult, SHARED_VERIFICATION_SEVERITY, SHARED_VERIFICATION_STATUS } from "../../../shared/contracts";
import { IVkveSemanticValidator } from "../vkve.types";
export class LinkedListVkveValidator implements IVkveSemanticValidator {
  readonly topicId = "LINKED_LIST" as const;
  validateSemanticSceneGraph(graph: ISceneGraph, trace: IStateExecutionTrace): IVerificationResult {
    const errors: IVerificationIssue[] = []; const fail=(code:string,message:string,sceneId?:string)=>errors.push({code,message,severity:SHARED_VERIFICATION_SEVERITY.ERROR,validator:"VKVE",sceneId});
    graph.scenes.forEach((scene,index)=>{ const state=index===0?trace.initialState:trace.transitions[index-1]?.resultingState; if(!state)return; const nodes=scene.objects.filter(o=>o.type==="NODE");
      if(nodes.length!==state.elements.length) fail("LIST_NODE_COUNT_MISMATCH","Rendered nodes do not match verified list state.",scene.id);
      nodes.forEach((node,i)=>{if(node.properties?.value!==state.elements[i]||node.properties?.index!==i)fail("LIST_NODE_ORDER_MISMATCH","Node value/index differs from deterministic order.",scene.id); const expected=i<nodes.length-1?i+1:null;if(node.properties?.nextIndex!==expected)fail("BROKEN_LIST_LINK","Node next reference is broken or cyclic.",scene.id);});
      const head=scene.objects.find(o=>o.id==="head_pointer"); if(nodes.length&&(!head||head.properties?.targetIndex!==0))fail("INVALID_HEAD_REFERENCE","HEAD must reference node 0.",scene.id);
    });
    return {valid:!errors.length,status:errors.length?SHARED_VERIFICATION_STATUS.FAILED:SHARED_VERIFICATION_STATUS.PASSED,confidenceScore:errors.length?0:1,errors,warnings:[],checkedAt:new Date().toISOString()};
  }
}
export const linkedListVkveValidator=new LinkedListVkveValidator();
