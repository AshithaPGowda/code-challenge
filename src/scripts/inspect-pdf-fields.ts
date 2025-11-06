#!/usr/bin/env tsx

import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';

async function inspectPdfFields() {
  try {
    console.log('🔍 Inspecting I-9 PDF form fields...\n');
    
    // Load the I-9 PDF from public directory
    const pdfPath = join(process.cwd(), 'public', 'i-9.pdf');
    console.log(`📄 Loading PDF from: ${pdfPath}`);
    
    const pdfBytes = readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    console.log(`📊 PDF loaded successfully`);
    console.log(`   Pages: ${pdfDoc.getPageCount()}`);
    console.log(`   Creator: ${pdfDoc.getCreator() || 'Unknown'}`);
    console.log(`   Subject: ${pdfDoc.getSubject() || 'None'}\n`);
    
    // Get form fields
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    console.log(`📝 Form analysis:`);
    console.log(`   Total fields: ${fields.length}\n`);
    
    if (fields.length === 0) {
      console.log('❌ No form fields found in this PDF');
      console.log('   This means we need to draw text at specific coordinates');
      console.log('   instead of filling form fields directly.\n');
      
      // Analyze pages for text placement
      console.log('📐 Page dimensions:');
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        console.log(`   Page ${i + 1}: ${width} x ${height} points`);
      }
      
      return;
    }
    
    console.log('✅ Form fields found! Listing all fields:\n');
    
    // Group fields by type
    const fieldsByType: Record<string, string[]> = {};
    
    fields.forEach((field) => {
      const fieldName = field.getName();
      const fieldType = field.constructor.name;
      
      if (!fieldsByType[fieldType]) {
        fieldsByType[fieldType] = [];
      }
      fieldsByType[fieldType].push(fieldName);
      
      console.log(`📋 Field: "${fieldName}"`);
      console.log(`   Type: ${fieldType}`);
      
      // Get field-specific details
      try {
        if (field.constructor.name === 'PDFTextField') {
          const textField = field as any;
          console.log(`   Max length: ${textField.getMaxLength() || 'Unlimited'}`);
          console.log(`   Current value: "${textField.getText() || ''}"`);
        } else if (field.constructor.name === 'PDFCheckBox') {
          const checkBox = field as any;
          console.log(`   Is checked: ${checkBox.isChecked()}`);
        } else if (field.constructor.name === 'PDFRadioGroup') {
          const radioGroup = field as any;
          const options = radioGroup.getOptions();
          console.log(`   Options: [${options.join(', ')}]`);
          console.log(`   Selected: "${radioGroup.getSelected() || 'None'}"`);
        } else if (field.constructor.name === 'PDFDropdown') {
          const dropdown = field as any;
          const options = dropdown.getOptions();
          console.log(`   Options: [${options.join(', ')}]`);
          console.log(`   Selected: "${dropdown.getSelected() || 'None'}"`);
        }
      } catch (e) {
        console.log(`   (Could not read field details: ${e instanceof Error ? e.message : 'Unknown error'})`);
      }
      
      console.log('');
    });
    
    // Summary by type
    console.log('📊 Summary by field type:');
    Object.entries(fieldsByType).forEach(([type, names]) => {
      console.log(`   ${type}: ${names.length} fields`);
      names.forEach(name => console.log(`     - ${name}`));
    });
    
    console.log('\n✨ PDF inspection completed!');
    console.log('💡 You can now use these field names to programmatically fill the form.');
    
  } catch (error) {
    console.error('❌ Error inspecting PDF:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.log('\n💡 Make sure the I-9 PDF file exists at public/i9.pdf');
      } else if (error.message.includes('Invalid PDF')) {
        console.log('\n💡 The PDF file might be corrupted or not a valid PDF');
      }
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  inspectPdfFields()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { inspectPdfFields };