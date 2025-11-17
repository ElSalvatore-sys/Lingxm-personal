#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import time
from datetime import datetime

class VocabularyAutomation:
    def __init__(self, test_mode=True):
        self.test_mode = test_mode
        self.base_dir = "/Users/eldiaploo/Desktop/LingXM-Personal"
        self.prompts_dir = f"{self.base_dir}/prompts_batch2-25"
        self.output_dir = f"{self.base_dir}/public/data/universal"
        self.log_file = f"{self.base_dir}/automation_log.txt"
        
        self.languages = {
            'en': ('English', 'generation/en-a1', 2, 25),
            'de': ('German', 'generation/de-a1', 2, 25),
            'es': ('Spanish', 'generation/es-a1', 2, 25),
            'ar': ('Arabic', 'generation/ar-a1', 2, 25),
            'fr': ('French', 'generation/fr-a1', 3, 25),
            'it': ('Italian', 'generation/it-a1', 2, 25),
            'ru': ('Russian', 'generation/ru-a1', 2, 25),
            'pl': ('Polish', 'generation/pl-a1', 2, 25),
            'fa': ('Persian', 'generation/fa-a1', 2, 25)
        }
        
        self.progress_file = f"{self.base_dir}/automation_progress.json"
        self.load_progress()
    
    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_msg = f"[{timestamp}] {message}"
        print(log_msg)
        with open(self.log_file, 'a') as f:
            f.write(log_msg + "\n")
    
    def load_progress(self):
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                self.progress = json.load(f)
            self.log(f"Loaded progress: {sum(len(v) for v in self.progress.values())} batches completed")
        else:
            self.progress = {lang: [] for lang in self.languages.keys()}
    
    def save_progress(self, lang_code, batch_num):
        if lang_code not in self.progress:
            self.progress[lang_code] = []
        if batch_num not in self.progress[lang_code]:
            self.progress[lang_code].append(batch_num)
        
        with open(self.progress_file, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def validate_json(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                return False, "Not a list"
            
            if len(data) != 20:
                return False, f"Expected 20 words, got {len(data)}"
            
            required_fields = ['id', 'word', 'translations', 'explanation', 'examples', 'cefrLevel']
            for field in required_fields:
                if field not in data[0]:
                    return False, f"Missing field: {field}"
            
            if len(data[0]['translations']) != 9:
                return False, f"Expected 9 translations, got {len(data[0]['translations'])}"
            
            return True, "Valid"
        except Exception as e:
            return False, str(e)
    
    def run_command(self, cmd, cwd=None):
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                cwd=cwd or self.base_dir,
                capture_output=True,
                text=True,
                timeout=300
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Command timed out"
    
    def checkout_branch(self, branch):
        self.log(f"Checking out branch: {branch}")
        success, stdout, stderr = self.run_command(f"git checkout {branch}")
        if not success:
            self.log(f"Failed to checkout {branch}: {stderr}")
            return False
        return True
    
    def process_batch(self, lang_code, lang_name, batch_num):
        if batch_num in self.progress.get(lang_code, []):
            self.log(f"{lang_name} batch {batch_num} already completed, skipping")
            return True
        
        self.log(f"Processing {lang_name} batch {batch_num}")
        
        prompt_file = f"{self.prompts_dir}/{lang_code}_batch{batch_num:02d}.md"
        if not os.path.exists(prompt_file):
            self.log(f"Prompt file not found: {prompt_file}")
            return False
        
        output_file = f"{self.output_dir}/{lang_code}-a1-batch{batch_num}.json"
        
        self.log(f"Prompt file: {prompt_file}")
        self.log(f"Expected output: {output_file}")
        self.log("MANUAL STEP: Copy prompt and paste into Claude Code")
        
        input(f"Press ENTER when {output_file} is ready...")
        
        if not os.path.exists(output_file):
            self.log(f"File not found: {output_file}")
            return False
        
        valid, msg = self.validate_json(output_file)
        if not valid:
            self.log(f"Validation failed: {msg}")
            return False
        
        self.log("Validation passed!")
        
        commit_msg = f"feat(vocab): {lang_name} A1 batch {batch_num} (words {(batch_num-1)*20+1}-{batch_num*20})"
        
        self.log("Committing to git...")
        success, _, stderr = self.run_command(f"git add {output_file}")
        if not success:
            self.log(f"Git add failed: {stderr}")
            return False
        
        success, _, stderr = self.run_command(f'git commit -m "{commit_msg}"')
        if not success:
            self.log(f"Git commit failed: {stderr}")
            return False
        
        self.log(f"Batch {batch_num} complete!")
        self.save_progress(lang_code, batch_num)
        
        return True
    
    def run_test_mode(self):
        self.log("="*60)
        self.log("TEST MODE: Running English batch 2 only")
        self.log("="*60)
        
        lang_code = 'en'
        lang_name, branch, start, end = self.languages[lang_code]
        
        if not self.checkout_branch(branch):
            return False
        
        success = self.process_batch(lang_code, lang_name, 2)
        
        if success:
            self.log("="*60)
            self.log("TEST MODE SUCCESSFUL!")
            self.log("="*60)
            return True
        else:
            self.log("TEST MODE FAILED")
            return False
    
    def run_full_automation(self):
        self.log("="*60)
        self.log("FULL AUTOMATION MODE")
        self.log("="*60)
        
        total_batches = sum((end - start + 1) for _, _, start, end in self.languages.values())
        completed = sum(len(v) for v in self.progress.values())
        
        self.log(f"Progress: {completed}/{total_batches} batches")
        
        for lang_code, (lang_name, branch, start, end) in self.languages.items():
            self.log(f"\nStarting {lang_name}")
            
            if not self.checkout_branch(branch):
                self.log(f"Skipping {lang_name}")
                continue
            
            for batch_num in range(start, end + 1):
                success = self.process_batch(lang_code, lang_name, batch_num)
                if not success:
                    self.log(f"Failed at {lang_name} batch {batch_num}")
                    return False
                time.sleep(2)
            
            self.log(f"Pushing {lang_name} branch...")
            self.run_command(f"git push origin {branch}")
        
        self.log("="*60)
        self.log("FULL AUTOMATION COMPLETE!")
        self.log("="*60)
        return True

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--full":
        automation = VocabularyAutomation(test_mode=False)
        automation.run_full_automation()
    else:
        print("TEST MODE: Running English batch 2 only")
        print("For full automation: python3 automate_vocabulary.py --full\n")
        automation = VocabularyAutomation(test_mode=True)
        automation.run_test_mode()

if __name__ == "__main__":
    main()