import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapDatabaseItem} from '../src/domain/databaseItems.ts';
import {mapDatabaseTag} from '../src/domain/tags.ts';
import {draftFor} from '../src/domain/itemForm.ts';

const row={id:'1',public_id:'uuid',parent_id:null,type:'OBJECT',name:'Telefon',manual_icon:null,description:'',revision:'0'};
const category={id:'9007199254740995',name:'Elektronik',icon_name:'cpu'};

test('category icons override explicit and type icons while tag IDs retain bigint precision',()=>{
  const item=mapDatabaseItem({...row,manual_icon:'box',category});
  assert.equal(item.icon,'cpu');
  assert.deepEqual(item.tag,{id:'9007199254740995',name:'Elektronik',icon:'cpu'});
  assert.equal(draftFor(item).tagId,category.id);
});
test('untagged items keep standard type icons and category-less drafts remain valid options',()=>{
  for(const [type,icon] of [['LOCATION','map-pin'],['STORAGE','package'],['OBJECT','box']]) {
    const item=mapDatabaseItem({...row,type,category:null});
    assert.equal(item.icon,icon);
    assert.equal(item.tag,undefined);
    assert.equal(draftFor(item).tagId,'');
  }
});
test('invalid tag rows and imprecise numeric IDs fail instead of silently losing their categories',()=>{
  assert.throws(()=>mapDatabaseTag({...category,id:Number(category.id)}),/taggformat/);
  assert.throws(()=>mapDatabaseItem({...row,category:{...category,icon_name:null}}),/taggformat/);
  assert.throws(()=>mapDatabaseTag(null),/taggformat/);
});
test('editing a tag draft cannot modify the saved item before Save',()=>{
  const item=mapDatabaseItem({...row,category});
  const draft=draftFor(item);
  draft.tagId='';
  assert.equal(item.tag?.id,category.id);
  assert.equal(item.icon,'cpu');
});
